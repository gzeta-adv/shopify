import airtable, { FieldSet, actionLogger } from '@/clients/airtable'
import shopify, {
  COLLECTION_METAFIELD,
  Collection,
  RESOURCES_LIMIT,
  adminDomain,
  parseUserErrors,
} from '@/clients/shopify'
import { Action, ActionStatus } from '@/types'
import { env, logger, toID, titleize } from '@/utils'

const TABLE_ID = env('AIRTABLE_COLLECTION_STATUS_TABLE_ID')
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

interface PublishLog extends FieldSet {
  Date: string
  Status: ActionStatus
  Action: 'Publish' | 'Unpublish'
  'Collection ID': number
  'Collection Title': string
  'Collection URL': string
  Obsolete: boolean
  'Products Count': number
  'Previous Publications': number
  'New Publications': number
  Message?: string
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
  Date: new Date().toISOString(),
  Status: titleize(status) as PublishLog['Status'],
  Action: titleize(action) as PublishLog['Action'],
  'Collection ID': toID(collection.id),
  'Collection Title': collection.title || '',
  'Collection URL': `https://${adminDomain}/collections/${toID(collection.id)}`,
  Obsolete: obsolete,
  'Products Count': collection.productsCount.count,
  'Previous Publications': collection.resourcePublicationsV2.length,
  'New Publications': action === PublishAction.publish ? publications.length : 0,
  Message: message,
})

const updateCollections = async (
  args: Record<PublishAction, PublishCollection[]>,
  publications: string[]
): Promise<void> => {
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

        if (errors) await actionLogger.error({ action: ACTION, errors, message: errors })

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

    logger.notice(`${actionTitle}ed ${updatedCollections.length} out of ${collections.length} collections.`)

    const records = await airtable.createRecords<PublishLog>({ tableId: TABLE_ID, records: logs })
    await actionLogger.fromRecords({ action: ACTION, records })
  }

  if (skipped.length === actions.length) {
    await actionLogger.skip({ action: ACTION, message: `No changes to synchronize.` })
  }
}

/**
 * Synchronize the publications of all collections in the Shopify store depending on a boolean metafield.
 */
export const syncCollectionsStatus: Action = async (): Promise<void> => {
  const { data } = await shopify.fetchAllCollections<PublishCollection>({ fields })
  const collections = data?.collections?.nodes || []
  if (!collections.length) {
    return await actionLogger.error({ action: ACTION, message: 'No collections found.' })
  }

  const publications = [
    ...new Set(
      collections.flatMap(({ resourcePublicationsV2 }) =>
        resourcePublicationsV2.map(({ publication }) => publication.id)
      )
    ),
  ]
  if (!publications.length) {
    return await actionLogger.error({ action: ACTION, message: 'No publications found.' })
  }

  const publish = collections.filter(
    collection => !isObsolete(collection) && countPublications(collection) < publications.length
  )
  const unpublish = collections.filter(collection => isObsolete(collection) && countPublications(collection) > 0)

  await updateCollections({ publish, unpublish }, publications)
}
