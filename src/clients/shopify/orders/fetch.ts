import { client, RESOURCES_LIMIT } from '@/clients/shopify'
import { resolveEdges } from '@/utils'

import type { ClientResponse, Order } from '@/clients/shopify'

/**
 * Request options for fetching orders using the Shopify Admin API.
 */
export interface FetchOrdersRequestOptions {
  cursor?: string
  fields?: string
  limit?: number
}

/**
 * Response for fetching orders using the Shopify Admin API.
 */
export interface FetchOrdersResponse<T = Order>
  extends ClientResponse<{
    orders?: {
      edges: T[]
      pageInfo?: {
        startCursor: string
        endCursor: string
        hasPreviousPage: boolean
        hasNextPage: boolean
      }
    }
  }> {}

/**
 * Fetch orders and page info from the Shopify API.
 */
export const fetchOrders = async <T extends Order>({ cursor, fields, limit }: FetchOrdersRequestOptions = {}): Promise<
  FetchOrdersResponse<T>
> => {
  const params = cursor ? ', $cursor: String!' : ''
  const args = cursor ? ', after: $cursor' : ''
  const nodes = ['id', 'name', fields].filter(String).join('\n')

  const operation = `
    query ($limit: Int!${params}) {
      orders(first: $limit${args}) {
        edges {
          node {
            ${nodes}
            transactions {
              paymentDetails {
                ... on ShopPayInstallmentsPaymentDetails {
                  paymentMethodName
                }
              }
            }
          }
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
 * Fetch all orders from the Shopify API.
 */
export const fetchAllOrders = async <T extends Order = Order>({
  cursor,
  fields,
  limit,
}: FetchOrdersRequestOptions = {}): Promise<FetchOrdersResponse<T>> => {
  const edges: T[] = []
  const errors = []

  while (true) {
    try {
      const { data, errors: error } = await fetchOrders<T>({ cursor, fields, limit })

      if (!data?.orders) {
        if (error) errors.push(error as any)
        continue
      }

      const { edges: variantEdges, pageInfo } = data.orders

      edges.push(...resolveEdges<T>(variantEdges))

      if (!pageInfo?.hasNextPage) break
      cursor = pageInfo.endCursor
    } catch (e) {
      errors.push(e)
    }
  }

  return {
    data: { orders: { edges } },
    errors,
  }
}
