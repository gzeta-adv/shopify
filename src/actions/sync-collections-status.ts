import { exit } from 'process'
import sheets, { hyperlink } from '@@/google/sheets'
import shopify, { COLLECTION_METAFIELD, RESOURCES_LIMIT, Collection, adminDomain, parseUserErrors } from '@@/shopify'
import { Action, ActionPayload, ActionStatus } from '@/types'
import { logger, toID, titleize } from '@/utils'

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
const collectionHyperlink = (collection: Collection) =>
  hyperlink(`https://${adminDomain}/collections/${toID(collection.id)}`, collection.title)
const isObsolete = ({ metafields }: PublishCollection) => {
  const { value } = metafields.find(({ key }) => key === COLLECTION_METAFIELD) || {}
  return value === 'true'
}

const updateCollections = async (
  args: Record<PublishAction, PublishCollection[]>,
  publications: string[],
  actionLog: ActionPayload
): Promise<boolean> => {
  const actions = Object.keys(args) as PublishAction[]
  const updatedCollections = []

  for (const action of actions) {
    const actionTitle = titleize(action)
    const collections = args[action]
    if (!collections.length) continue

    const fn = action === PublishAction.publish ? shopify.publishCollection : shopify.unpublishCollection

    logger.info(`${actionTitle}ing ${collections.length} collections...`)

    for (const collection of collections) {
      const { id, title } = collection
      const { collection: updated, userErrors } = await fn({ id, publications, fields })
      const logBody = {
        ...actionLog,
        action,
        collection: collectionHyperlink(updated as Collection),
        products: collection.productsCount.count,
        previous: countPublications(collection),
        new: countPublications(updated as PublishCollection) || 0,
      }

      if (!updated) {
        logger.error(`⚠︎ Failed: ${toID(id)} (${title})`)
        const errors = parseUserErrors(userErrors)

        if (errors) {
          await sheets.logSyncCollectionsStatus({
            ...actionLog,
            status: ActionStatus.failed,
            errors,
            message: 'User errors',
          })
          return false
        }

        await sheets.logSyncCollectionsStatus({
          ...logBody,
          status: ActionStatus.failed,
          message: errors || 'Unknown error',
        })
        continue
      }

      updatedCollections.push(updated)
      logger.info(`✓ ${actionTitle}: ${toID(updated.id)} (${updated.title})`)

      await sheets.logSyncCollectionsStatus({ ...logBody, status: ActionStatus.success })
    }

    logger.notice(`${actionTitle}ed ${updatedCollections.length} out of ${collections.length} collections`)
  }
  if (!updatedCollections.length) logger.notice('No changes')
  return true
}

/**
 * Synchronize the publications of all collections in the Shopify store depending on a boolean metafield.
 */
export const syncCollectionsStatus: Action = async ({ event, retries, runId }) => {
  for (const i of Array(retries).keys()) {
    const isLastRetry = i === retries - 1

    const actionLog = { event, runId }

    const { data } = await shopify.fetchAllCollections<PublishCollection>({ fields })
    const collections = data?.collections?.nodes || []
    if (!collections.length) {
      await sheets.logSyncCollectionsStatus({
        ...actionLog,
        status: ActionStatus.failed,
        message: 'No collections found',
      })
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
      await sheets.logSyncCollectionsStatus({
        ...actionLog,
        status: ActionStatus.failed,
        message: 'No publications found',
      })
      if (isLastRetry) exit()
      continue
    }

    const publish = collections.filter(col => !isObsolete(col) && countPublications(col) < publications.length)
    const unpublish = collections.filter(col => isObsolete(col) && countPublications(col) > 0)

    if (await updateCollections({ publish, unpublish }, publications, actionLog)) exit()
  }
}
