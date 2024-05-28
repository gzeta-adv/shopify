import api from '@/api'
import { COLLECTION_OUTDATED_KEY, SHOPIFY_RESOURCES_LIMIT } from '@/data'

import type { Collection } from '@/api'
import { logger, toID } from '@/utils'

const fields = `
  metafields(first: 1, keys: ["${COLLECTION_OUTDATED_KEY}"]) {
    edges {
      node {
        key
        value
      }
    }
  }
  resourcePublicationsV2(first: ${SHOPIFY_RESOURCES_LIMIT}) {
    edges {
      node {
        isPublished
        publication {
          id
        }
      }
    }
  }
`

interface CollectionWithFields extends Collection {
  metafields: { key: string; value: string }[]
  resourcePublicationsV2: { isPublished: boolean; publication: { id: string } }[]
}

export const unpublishOutdatedCollections = async () => {
  const outdatedCollections = []
  const { collections } = await api.fetchAllCollections<CollectionWithFields>({ fields })

  for (const collection of collections.nodes) {
    const { value } = collection.metafields.find(({ key }: { key: string }) => key === COLLECTION_OUTDATED_KEY) || {}
    const isObsolete = value === 'true'
    if (!isObsolete) continue

    const publications = collection.resourcePublicationsV2
      .filter(({ isPublished }) => isPublished)
      .map(({ publication }) => publication.id)

    if (!publications.length) continue

    outdatedCollections.push({ id: collection.id, publications })
  }

  if (!outdatedCollections.length) {
    logger.notice('No outdated collections found.')
    return
  }

  logger.info(`Unpublishing ${outdatedCollections.length} outdated collections...`)

  const unpublishedCollections: Collection[] = []

  for (const outdatedCollection of outdatedCollections) {
    try {
      const { collectionUnpublish } = await api.unpublishCollection(outdatedCollection)
      const { collection, userErrors } = collectionUnpublish

      if (!collection) return
      if (userErrors?.length) throw new Error(userErrors.map(({ field, message }) => `${field}: ${message}`).join('\n'))

      unpublishedCollections.push(collection)
    } catch (error) {
      logger.error(error)
    }
  }

  logger.notice(`
    Unpublished ${unpublishedCollections.length} collections:
    ${unpublishedCollections.map(({ id, title }) => `${toID(id)} - ${title}`).join('\n')}
  `)
}
