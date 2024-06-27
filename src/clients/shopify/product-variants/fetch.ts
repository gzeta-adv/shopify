import { client, RESOURCES_LIMIT } from '@/clients/shopify'
import { logger, resolveEdges, toID } from '@/utils'

import type { ClientResponse, ProductVariant } from '@/clients/shopify'

const PRODUCT_VARIANT_FIELDS = `
  id, 
  sku, 
  displayName, 
  inventoryQuantity, 
  inventoryItem {
    id
  },
  product { 
    id, 
    title, 
    onlineStoreUrl
    seo {
      title
    }
  }`

/**
 * Request options for fetching a single product variant.
 */
export interface FetchProductVariantRequestOptions {
  id: string
  fields?: string
}

/**
 * Response for fetching a product variant.
 */
export interface FetchProductVariantResponse<T = ProductVariant>
  extends ClientResponse<{
    productVariant: T
  }> {}

const fetchProductVariantOperation = ({ id, fields }: FetchProductVariantRequestOptions) => {
  const nodeFields = [PRODUCT_VARIANT_FIELDS, fields].filter(Boolean).join('\n')

  return `
    query {
      productVariant(id: "${id}") {
        ${nodeFields}
      }
    }
  `
}

/**
 * Request options for fetching product variants.
 */
export interface FetchProductVariantsRequestOptions {
  cursor?: string
  fields?: string
  ids?: string[]
  limit?: number
}

/**
 * Response for fetching product variants.
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

const fetchProductVariantsOperation = ({ cursor, fields, ids }: FetchProductVariantsRequestOptions) => {
  const params = ['$limit: Int!']
  const args = ['first: $limit']

  const queries = ['published_status:published']
  if (ids?.length) queries.push(`(${ids.map(id => `id:${toID(id)}`).join(' OR ')})`)
  args.push(`query: "${queries.join(' AND ')}"`)

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
 * Fetch a single product variant.
 */
export const fetchProductVariant = async <T extends ProductVariant>({
  id,
  fields,
}: FetchProductVariantRequestOptions): Promise<FetchProductVariantResponse<T>> =>
  await client.request(fetchProductVariantOperation({ id, fields }), {
    variables: { id },
  })

/**
 * Fetch product variants and page info.
 */
export const fetchProductVariants = async <T extends ProductVariant>({
  cursor,
  fields,
  ids,
  limit,
}: FetchProductVariantsRequestOptions = {}): Promise<FetchProductVariantsResponse<T>> => {
  const variables = { cursor, limit: limit || RESOURCES_LIMIT }
  return await client.request(fetchProductVariantsOperation({ cursor, fields, ids }), { variables })
}

/**
 * Fetch all product variants.
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
