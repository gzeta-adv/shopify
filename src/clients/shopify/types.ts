import { ClientResponse as ShopifyClientResponse } from '@shopify/admin-api-client'
import { BaseObject } from '@/types'

/**
 * A response from the Shopify API.
 */
export interface ClientResponse<T extends Record<string, any>> extends Omit<ShopifyClientResponse<T>, 'errors'> {
  errors?: ShopifyClientResponse['errors'] | ShopifyClientResponse['errors'][]
}

/**
 * A response error from the Shopify API.
 */
export interface ResponseError {
  networkStatusCode?: number
  message?: string
  graphQLErrors?: {
    message: string
    extensions: {
      code: string
      documentation?: string
    }
  }[]
  response?: Response
}

/**
 * Generic Shopify resource.
 */
export interface Resource extends BaseObject {
  id: string
}

/**
 * Shopify collection resource.
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/Collection
 */
export interface Collection extends BaseObject {
  title?: string
}

/**
 * Shopify inventory item resource.
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/InventoryItem
 */
export interface InventoryItem extends BaseObject {}

/**
 * Shopify location resource.
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/Location
 */
export interface Order extends BaseObject {
  name?: string
}

/**
 * Shopify location resource.
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/Location
 */
export interface Location extends BaseObject {
  isActive?: boolean
  shipsInventory?: boolean
}

/**
 * Shopify product resource.
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/Product
 */
export interface Product extends BaseObject {
  title: string
}

/**
 * Shopify product variant resource.
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/ProductVariant
 */
export interface ProductVariant extends BaseObject {
  sku?: string
  inventoryQuantity?: number
  inventoryItem?: InventoryItem
  product?: Product
}
