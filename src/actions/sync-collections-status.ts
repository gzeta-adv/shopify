import { exit } from 'process'
import sheets, { SHEETS, hyperlink } from '@@/google/sheets'
import shopify, { COLLECTION_METAFIELD, RESOURCES_LIMIT, Collection, adminDomain, parseUserErrors } from '@@/shopify'
import { Action, ActionRunPayload, ActionStatus } from '@/types'
import { logger, toID, titleize, formatDate } from '@/utils'

const ACTION = 'Sync Collections Status'

interface PublishCollection extends Collection {
  metafields: {
    key: string
    value: string
  }[]
  resourcePublicationsV2: {
    isPublished: boolean
    publication: {
      id: string
    }
  }[]
  productsCount: {
    count: number
  }
}

enum PublishAction {
  publish = 'publish',
  unpublish = 'unpublish',
}

interface PublishLog {
  Date: string
  Status: ActionStatus
  Action: 'Publish' | 'Unpublish'
  Collection: string
  Obsolete: boolean
  Products: number
  'Previous Publications': number
  'New Publications': number
  Message?: string
  Notes?: string
}

interface PublishLogOptions {
  status: ActionStatus
  action: PublishAction
  collection: PublishCollection
  publications: string[]
  obsolete: boolean
  message?: string
}

const fields = `
  metafields(first: 1, keys: ["${COLLECTION_METAFIELD}"]) {
    edges {
      node {
        key
        value
      }
    }
  }
  resourcePublicationsV2(first: ${RESOURCES_LIMIT}) {
    edges {
      node {
        publication {
          id
        }
      }
    }
  }
  productsCount {
    count
  }
`

const countPublications = ({ resourcePublicationsV2 }: PublishCollection) => resourcePublicationsV2.length

const isObsolete = ({ metafields }: PublishCollection) => {
  const { value } = metafields.find(({ key }) => key === COLLECTION_METAFIELD) || {}
  return value === 'true'
}

const createLog = ({ status, action, collection, message, publications, obsolete }: PublishLogOptions): PublishLog => ({
  Date: formatDate(),
  Status: titleize(status) as PublishLog['Status'],
  Action: titleize(action) as PublishLog['Action'],
  Collection: hyperlink(`https://${adminDomain}/collections/${toID(collection.id)}`, collection.title),
  Obsolete: obsolete,
  Products: collection.productsCount.count,
  'Previous Publications': collection.resourcePublicationsV2.length,
  'New Publications': action === PublishAction.publish ? publications.length : 0,
  Message: message,
  Notes: '',
})

const updateCollections = async (
  args: Record<PublishAction, PublishCollection[]>,
  publications: string[],
  actionLog: ActionRunPayload
): Promise<boolean> => {
  const actions = Object.keys(args) as PublishAction[]
  const logs: PublishLog[] = []
  const skipped: PublishAction[] = []

  for (const action of actions) {
    const collections = args[action]
    const actionTitle = titleize(action)

    if (!collections.length) {
      skipped.push(action)
      continue
    }

    const fn = action === PublishAction.publish ? shopify.publishCollection : shopify.unpublishCollection
    const updatedCollections = []

    logger.info(`${actionTitle}ing ${collections.length} collections...`)

    for (const collection of collections) {
      const { id, title } = collection
      const { collection: updated, userErrors } = await fn({ id, publications })

      const obsolete = isObsolete(collection)
      const logBody = { action, collection, publications, obsolete }

      if (!updated) {
        logger.error(`⚠︎ Failed: ${toID(id)} (${title})`)
        const errors = parseUserErrors(userErrors)

        if (errors) {
          await sheets.logFailedRun({ ...actionLog, errors, message: errors })
          return false
        }

        const log = createLog({
          ...logBody,
          status: ActionStatus.failed,
          message: errors || 'Unknown error',
        })
        logs.push(log)
        continue
      }

      updatedCollections.push(updated)
      logger.info(`✓ ${actionTitle}: ${toID(updated.id)} (${updated.title})`)

      const log = createLog({ ...logBody, status: ActionStatus.success })
      logs.push(log)
    }

    logger.notice(`${actionTitle}ed ${updatedCollections.length} out of ${collections.length} collections`)

    const records = await sheets.appendRows<PublishLog>({ sheet: SHEETS.SyncCollectionsStatus.name, values: logs })
    await sheets.logRun({
      ...actionLog,
      status: ActionStatus.success,
      message: `${actionTitle}ed ${updatedCollections.length} collections`,
      range: records.updates?.updatedRange,
    })
  }
  return true
}

/**
 * Synchronize the publications of all collections in the Shopify store depending on a boolean metafield.
 */
export const syncCollectionsStatus: Action = async ({ event, retries, runId }) => {
  for (const i of Array(retries).keys()) {
    const isLastRetry = i === retries - 1
    const retry = retries > 1 ? `${i + 1}/${retries}` : undefined

    const actionLog: ActionRunPayload = {
      action: ACTION,
      event,
      retry,
      runId,
    }

    const { data } = await shopify.fetchAllCollections<PublishCollection>({ fields })
    const collections = data?.collections?.nodes || []
    if (!collections.length) {
      await sheets.logFailedRun({ ...actionLog, message: 'No collections found' })
      if (isLastRetry) exit()
      continue
    }

    const publications = [
      ...new Set(
        collections.flatMap(({ resourcePublicationsV2 }) =>
          resourcePublicationsV2.map(({ publication }) => publication.id)
        )
      ),
    ]
    if (!publications.length) {
      await sheets.logFailedRun({ ...actionLog, message: 'No publications found' })
      if (isLastRetry) exit()
      continue
    }

    const publish = collections.filter(
      collection => !isObsolete(collection) && countPublications(collection) < publications.length
    )
    const unpublish = collections.filter(collection => isObsolete(collection) && countPublications(collection) > 0)

    if (await updateCollections({ publish, unpublish }, publications, actionLog)) exit()
  }
}
