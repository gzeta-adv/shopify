import { client } from '@@/shopify'

import type { Shop } from '@@/shopify'

const SHOP_FIELDS = `
  id,
  name,
  url
`

/**
 * Request options for fetching locations using the Shopify Admin API.
 */
export interface FetchShopRequestOptions {
  fields?: string
}

const fetchShopOperation = (fields?: string) => {
  const shopFields = [SHOP_FIELDS, fields].filter(Boolean).join('\n')

  return `
    query {
      shop {
        ${shopFields}
      }
    }
  `
}

/**
 * Fetch store locations using the Shopify API.
 */
export const fetchShop = async <T extends Shop = Shop>({ fields }: FetchShopRequestOptions = {}): Promise<T> => {
  const { data, errors } = await client.request(fetchShopOperation(fields))
  if (errors) throw new Error(errors.message)
  return data.shop
}
