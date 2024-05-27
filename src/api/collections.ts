import { ClientResponse } from '@shopify/admin-api-client'
import { client } from './client'
import { resolveNodes } from '@/utils/helpers'

const FETCH_LIMIT = 250

interface Collection {
  id: string
  metafields: {
    edges: {
      node: {
        key: string
        value: string
      }
    }[]
  }
}

interface CollectionsResponse {
  collections: {
    nodes: Collection[]
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
  }
}

interface CollectionsRequestOptions {
  cursor?: string
  fields?: string
}

export const fetchCollections = async ({
  cursor,
  fields,
}: CollectionsRequestOptions): Promise<ClientResponse<CollectionsResponse>> => {
  const params = `$limit: Int!${cursor ? ', $cursor: String!' : ''}`
  const args = `first: $limit${cursor ? ', after: $cursor' : ''}`
  const nodes = ['id', fields].filter(String).join('\n')

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
  return await client.request<CollectionsResponse>(operation, {
    variables: {
      limit: FETCH_LIMIT,
      cursor,
    },
  })
}

export const fetchAllCollections = async (fields?: string): Promise<Collection[]> => {
  const collections: Collection[] = []
  let cursor: string | undefined

  while (true) {
    const { data, errors } = await fetchCollections({ cursor, fields })

    if (errors) {
      console.error(errors)
      break
    }

    const { nodes, pageInfo } = data?.collections || {}

    collections.push(...resolveNodes(nodes || []))

    if (!pageInfo?.hasNextPage) break
    cursor = pageInfo.endCursor
  }

  return collections
}

export const collections = { fetchCollections, fetchAllCollections }
