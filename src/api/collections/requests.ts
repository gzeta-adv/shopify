import { client } from '@/api'
import { SHOPIFY_RESOURCES_LIMIT } from '@/data'
import { resolveNodes } from '@/utils'

import type {
  Collection,
  CollectionsRequestOptions,
  CollectionsResponse,
  UnpublishCollectionOptions,
  UnpublishCollectionResponse,
} from './types'

/**
 * Fetches collections and page data from the Shopify API.
 */
export const fetchCollections = async <T extends Collection>({
  cursor,
  fields,
}: CollectionsRequestOptions): Promise<CollectionsResponse<T>> => {
  const params = `$limit: Int!${cursor ? ', $cursor: String!' : ''}`
  const args = `first: $limit${cursor ? ', after: $cursor' : ''}`
  const nodes = ['id', 'title', fields].filter(String).join('\n')

  const operation = `
    query Collections(${params}) {
      collections(${args}) {
        nodes {
          ${nodes}
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `
  const { data, errors } = await client.request<CollectionsResponse>(operation, {
    variables: { cursor, limit: SHOPIFY_RESOURCES_LIMIT },
  })

  if (errors) throw new Error(`${errors.message} (${errors.networkStatusCode})`)
  if (!data?.collections) return { collections: { nodes: [], pageInfo: undefined } }

  return data as CollectionsResponse<T>
}

/**
 * Fetches all collections from the Shopify API.
 */
export const fetchAllCollections = async <T extends Collection = Collection>({
  cursor,
  fields,
}: CollectionsRequestOptions): Promise<CollectionsResponse<T>> => {
  const nodes: T[] = []

  while (true) {
    const { collections } = await fetchCollections<T>({ cursor, fields })

    nodes.push(...resolveNodes<T>(collections.nodes))

    if (!collections.pageInfo?.hasNextPage) break
    cursor = collections.pageInfo.endCursor
  }

  return {
    collections: {
      nodes,
    },
  }
}

/**
 * Unpublishes a collection from the specified publications.
 */
export const unpublishCollection = async <T extends Collection = Collection>({
  id,
  publications,
  fields,
}: UnpublishCollectionOptions): Promise<UnpublishCollectionResponse<T>> => {
  const nodes = ['id', 'title', fields].filter(String).join('\n')

  const operation = `
    mutation collectionUnpublish($input: CollectionUnpublishInput!) {
      collectionUnpublish(input: $input) {
        collection {
          ${nodes}
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const collectionPublications = publications.map(publicationId => ({ publicationId }))

  const input = { id, collectionPublications }

  const { data, errors } = await client.request<UnpublishCollectionResponse<T>>(operation, {
    variables: { input },
  })

  if (errors) throw new Error(`${errors.message} (${errors.networkStatusCode})`)

  return data as UnpublishCollectionResponse<T>
}
