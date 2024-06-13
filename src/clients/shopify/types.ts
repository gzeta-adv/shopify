import { ClientResponse as ShopifyClientResponse } from '@shopify/admin-api-client'
import { BaseObject } from '@/types'

export interface ClientResponse<T extends Record<string, any>> extends Omit<ShopifyClientResponse<T>, 'errors'> {
  errors?: ShopifyClientResponse['errors'] | ShopifyClientResponse['errors'][]
}

export interface Collection extends BaseObject {
  title?: string
}

export interface InventoryItem extends BaseObject {}

export interface Order extends BaseObject {
  name?: string
}

export interface Location extends BaseObject {
  isActive?: boolean
  shipsInventory?: boolean
}

export interface Product extends BaseObject {
  title?: string
}

export interface ProductVariant extends BaseObject {
  sku?: string
  inventoryQuantity?: number
  inventoryItem?: InventoryItem
  product?: Product
}
