import { client, RESOURCES_LIMIT } from '@/clients/shopify'
import { logger, resolveEdges } from '@/utils'

import type { ClientResponse, ProductVariant } from '@/clients/shopify'

const PRODUCT_VARIANT_FIELDS = 'id, sku, inventoryQuantity, inventoryItem { id }, product { id, title }'

/**
 * Request options for fetching products and variants using the Shopify Admin API.
 */
export interface FetchProductVariantsRequestOptions {
  cursor?: string
  fields?: string
  limit?: number
}

/**
 * Response for fetching product variants using the Shopify Admin API.
 */
export interface FetchProductVariantsResponse<T = ProductVariant>
  extends ClientResponse<{
    productVariants?: {
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
 * Returns the GraphQL operation to fetch product variants and page info from the Shopify API.
 */
const fetchProductVariantsOperation = ({ cursor, fields }: FetchProductVariantsRequestOptions) => {
  const params = ['$limit: Int!']
  const args = ['first: $limit', 'query: "published_status:published"']

  if (cursor) {
    params.push('$cursor: String!')
    args.push('after: $cursor')
  }

  const stringParams = params.join(', ')
  const stringArgs = args.join(', ')

  const nodeFields = [PRODUCT_VARIANT_FIELDS, fields].filter(Boolean).join('\n')

  return `
    query (${stringParams}) {
      productVariants(${stringArgs}) {
        edges {
          node {
            ${nodeFields}
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `
}

/**
 * Fetch product variants and page info from the Shopify API.
 */
export const fetchProductVariants = async <T extends ProductVariant>({
  cursor,
  fields,
  limit,
}: FetchProductVariantsRequestOptions = {}): Promise<FetchProductVariantsResponse<T>> =>
  await client.request(fetchProductVariantsOperation({ cursor, fields }), {
    variables: { cursor, limit: limit || RESOURCES_LIMIT },
  })

/**
 * Fetch all product variants from the Shopify API.
 */
export const fetchAllProductVariants = async <T extends ProductVariant = ProductVariant>({
  cursor,
  fields,
  limit,
}: FetchProductVariantsRequestOptions = {}): Promise<FetchProductVariantsResponse<T>> => {
  const edges: T[] = []
  const errors = []

  while (true) {
    const { data, errors: error } = await fetchProductVariants<T>({ cursor, fields, limit })

    if (!data?.productVariants) {
      if (error) {
        errors.push(error as any)
        logger.error(error)
      }
      continue
    }

    const { edges: variantEdges, pageInfo } = data.productVariants

    edges.push(...resolveEdges<T>(variantEdges))

    if (!pageInfo?.hasNextPage) break
    cursor = pageInfo.endCursor
  }

  return {
    data: { productVariants: { edges } },
    errors,
  }
}
