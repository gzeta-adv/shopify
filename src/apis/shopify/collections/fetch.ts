import { client, RESOURCES_LIMIT } from '#shopify'
import { resolveNodes } from '@/utils'

import type { ClientResponse, Collection } from '#shopify'

/**
 * Request options for fetching collections using the Shopify Admin API.
 */
export interface FetchCollectionsRequestOptions {
  cursor?: string
  fields?: string
  limit?: number
}

/**
 * Response after fetching collections using the Shopify Admin API.
 */
export interface FetchCollectionsResponse<T = Collection>
  extends ClientResponse<{
    collections?: {
      nodes: T[]
      pageInfo?: {
        startCursor: string
        endCursor: string
        hasPreviousPage: boolean
        hasNextPage: boolean
      }
    }
  }> {}

/**
 * Fetches collections and page data from the Shopify API.
 */
export const fetchCollections = async <T extends Collection>({
  cursor,
  fields,
  limit,
}: FetchCollectionsRequestOptions): Promise<FetchCollectionsResponse<T>> => {
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
  return await client.request(operation, {
    variables: { cursor, limit: limit || RESOURCES_LIMIT },
  })
}

/**
 * Fetches all collections from the Shopify API.
 */
export const fetchAllCollections = async <T extends Collection = Collection>({
  cursor,
  fields,
  limit,
}: FetchCollectionsRequestOptions): Promise<FetchCollectionsResponse<T>> => {
  const nodes: T[] = []
  const errors = []

  while (true) {
    const { data, errors: error } = await fetchCollections<T>({ cursor, fields, limit })

    if (!data?.collections) {
      if (errors) errors.push(error as any)
      continue
    }

    const { nodes: collectionNodes, pageInfo } = data.collections

    nodes.push(...resolveNodes<T>(collectionNodes))

    if (!pageInfo?.hasNextPage) break
    cursor = pageInfo.endCursor
  }

  return {
    data: { collections: { nodes } },
    errors,
  }
}
