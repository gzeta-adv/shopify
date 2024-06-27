import sheets, { hyperlink } from '@@/google/sheets'
import shopify, {
  COLLECTION_METAFIELD,
  RESOURCES_LIMIT,
  Collection,
  adminDomain,
  parseUserErrors,
  Shop,
  storeDomain,
} from '@@/shopify'
import { Action, ActionPayload, ActionStatus } from '@/types'
import { exit, logger, toID, titleize } from '@/utils'

interface PublishCollection extends Collection {
  handle: string
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
  handle
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

const collectionHyperlink = (collection: Collection) =>
  hyperlink(`https://${adminDomain}/collections/${toID(collection.id)}`, collection.title)
const websiteHyperlink = (collection: PublishCollection, shop?: Shop): string => {
  const url = `${shop?.url || storeDomain}/collections/${collection.handle}`
  const name = `${collection.title}${shop?.name ? ` - ${shop.name}` : ''}`
  return hyperlink(url, name)
}

const updateCollections = async (
  args: Record<PublishAction, PublishCollection[]>,
  publications: string[],
  shop?: Shop,
  actionLog: ActionPayload = {}
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
        collection: collectionHyperlink(updated as PublishCollection),
        website: websiteHyperlink(updated as PublishCollection, shop),
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
            message: 'Error: user errors',
            errors,
          })
          return false
        }

        await sheets.logSyncCollectionsStatus({
          ...logBody,
          status: ActionStatus.failed,
          message: 'Error: unknown error',
          errors,
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
  const shop = await shopify.fetchShop()

  for (const _ of Array(retries).keys()) {
    const actionLog = { event, runId }

    const { data, errors } = await shopify.fetchAllCollections<PublishCollection>({ fields })
    const collections = data?.collections?.nodes || []

    if (!collections.length || (Array.isArray(errors) && errors.length)) {
      await sheets.logSyncCollectionsStatus({
        ...actionLog,
        status: ActionStatus.failed,
        message: 'Error: no collections found',
        errors,
      })
      exit()
    }

    const publications = [
      ...new Set(
        collections.flatMap(({ resourcePublicationsV2 }) =>
          resourcePublicationsV2.map(({ publication }) => publication.id)
        )
      ),
    ]
    if (!publications.length || (Array.isArray(errors) && errors.length)) {
      await sheets.logSyncCollectionsStatus({
        ...actionLog,
        status: ActionStatus.failed,
        message: 'Error: no publications found',
        errors,
      })
      exit()
    }

    const publish = collections.filter(col => !isObsolete(col) && countPublications(col) < publications.length)
    const unpublish = collections.filter(col => isObsolete(col) && countPublications(col) > 0)

    if (await updateCollections({ publish, unpublish }, publications, shop, actionLog)) exit(null, 0)
  }
}
