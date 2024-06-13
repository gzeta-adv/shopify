import { client } from '@/clients/shopify'

import type { InventoryItem, Location } from '@/clients/shopify'

export interface AdjustQuantitiesInput {
  reason: string
  name: string
  changes: {
    delta: number
    inventoryItemId: InventoryItem['id']
    locationId: Location['id']
  }[]
}

/**
 * Request options for updating inventory quantities using the Shopify Admin API.
 */
export interface AdjustQuantitiesRequestOptions {
  input: AdjustQuantitiesInput
}

/**
 * Response after updating inventory quantities using the Shopify Admin API.
 */
export interface AdjustQuantitiesResponse {
  inventoryAdjustQuantities: {
    inventoryAdjustmentGroup: {
      createdAt: string
      reason: string
      changes: {
        name: string
        delta: number
        quantityAfterChange: number
        item: {
          id: string
        }
      }[]
    }
  }
}

const operation = `
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
          }
        }
      }
    }
  }
`

export const adjustQuantities = async ({ input }: AdjustQuantitiesRequestOptions) =>
  await client.request<AdjustQuantitiesResponse>(operation, { variables: { input } })
