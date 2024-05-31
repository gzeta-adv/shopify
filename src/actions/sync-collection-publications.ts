import airtable from '#airtable'
import shopify, { COLLECTION_METAFIELD, RESOURCES_LIMIT, adminDomain, parseUserErrors } from '#shopify'
import { env, exit, logger, toID, toTitleCase } from '@/utils'
import { Action } from './types'

import type { FieldSet } from '#airtable'
import type { Collection } from '#shopify'

const TABLE_ID = env('AIRTABLE_LOGS_TABLE_ID')

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

enum PublishStatus {
  success = 'Success',
  failed = 'Failed',
}

interface PublishLog extends FieldSet {
  Date: string
  Status: PublishStatus
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
  status: PublishStatus
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
  Status: toTitleCase(status) as PublishLog['Status'],
  Action: toTitleCase(action) as PublishLog['Action'],
  'Collection ID': toID(collection.id),
  'Collection Title': collection.title,
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

  for (const action of actions) {
    const collections = args[action]

    if (!collections.length) {
      logger.notice(`No collections to ${action}.`)
      logger.info()
      continue
    }

    const fn = action === PublishAction.publish ? shopify.publishCollection : shopify.unpublishCollection
    const updatedCollections = []

    logger.info(`${toTitleCase(action)}ing ${collections.length} collections...`)

    for (const collection of collections) {
      const { id, title } = collection
      const { collection: updated, userErrors } = await fn({ id, publications })

      const obsolete = isObsolete(collection)
      const logBody = { action, collection, publications, obsolete }

      if (!updated) {
        logger.error(`⚠︎ Failed: ${toID(id)} (${title})`)
        const errors = parseUserErrors(userErrors)
        if (errors) logger.error(errors)

        const log = createLog({
          ...logBody,
          status: PublishStatus.failed,
          message: errors || 'Unknown error',
        })
        logs.push(log)

        continue
      }

      updatedCollections.push(updated)
      logger.info(`✓ ${toTitleCase(action)}: ${toID(updated.id)} (${updated.title})`)

      const log = createLog({ ...logBody, status: PublishStatus.success })
      logs.push(log)
    }

    logger.notice(`${toTitleCase(action)}ed ${updatedCollections.length} out of ${collections.length} collections.`)
    logger.info()

    await airtable.createRecords<PublishLog>({ tableId: TABLE_ID, records: logs })
  }
}

/**
 * Synchronize the publications of all collections in the Shopify store depending on a boolean metafield.
 */
export const syncCollectionPublications: Action = async (): Promise<void> => {
  const { data } = await shopify.fetchAllCollections<PublishCollection>({ fields })
  const collections = data?.collections?.nodes || []
  if (!collections.length) exit('No collections found.\n')

  const publications = [
    ...new Set(
      collections.flatMap(({ resourcePublicationsV2 }) =>
        resourcePublicationsV2.map(({ publication }) => publication.id)
      )
    ),
  ]
  if (!publications.length) exit('No publications found. Exiting.')

  const publish = collections.filter(
    collection => !isObsolete(collection) && countPublications(collection) < publications.length
  )
  const unpublish = collections.filter(collection => isObsolete(collection) && countPublications(collection) > 0)

  await updateCollections({ publish, unpublish }, publications)
}
