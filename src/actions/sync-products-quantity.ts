import shopify, { LOCATION_ID, adminDomain } from '@/clients/shopify'
import wikini from '@/clients/wikini'
import { env, exit, logger, toID, toPositive } from '@/utils'

import type { FieldSet } from '@/clients/airtable'
import type { InventoryItem, Product, ProductVariant } from '@/clients/shopify'
import type { AdjustQuantitiesInput } from '@/clients/shopify/inventory'
import type { Action } from '@/types'
import airtable from '@/clients/airtable'

const TABLE_ID = env('AIRTABLE_PRODUCT_QUANTITY_TABLE_ID')

const BASE_INPUT = {
  reason: 'correction',
  name: 'available',
}

enum ActionStatus {
  success = 'Success',
  failed = 'Failed',
}

interface ActionLog extends FieldSet {
  Date: string
  Status: ActionStatus
  'Product ID': number
  'Variant ID': number
  'Variant SKU': string
  'Variant URL': string
  'Previous Quantity': number
  'New Quantity': number
  Delta: number
}

interface Variant extends ProductVariant {
  sku: string
  product: Product
  inventoryQuantity: number
  inventoryItem: InventoryItem
}

interface VariantChange {
  variant: Variant
  quantities: number[]
  delta: number
  date?: string
}

const variantUrl = (variant: Variant): string =>
  `https://${adminDomain}/products/${toID(variant.product.id)}/variants/${toID(variant.id)}`

const buildLog = (change: VariantChange): ActionLog => ({
  Date: change.date || new Date().toISOString(),
  Status: ActionStatus.success,
  'Product ID': toID(change.variant.product.id),
  'Variant ID': toID(change.variant.id),
  'Variant SKU': change.variant.sku,
  'Variant URL': variantUrl(change.variant),
  'Previous Quantity': change.quantities[0],
  'New Quantity': change.quantities[1],
  Delta: change.delta,
})

/**
 * Synchronizes product quantities between the Wikini CMS and Shopify.
 */
export const syncProductsQuantity: Action = async () => {
  const variantChanges: VariantChange[] = []
  const logs: ActionLog[] = []

  const location = await shopify.fetchPrimaryLocation()
  const locationId = location?.id || LOCATION_ID

  const { data } = await shopify.fetchAllProductVariants<Variant>()
  const variants = data?.productVariants?.edges || []
  if (!variants.length) exit('No product variants found.')

  const items = variants.map(({ sku }) => ({ variantId: sku }))
  const availabilities = await wikini.verifyAvailability({ items })

  const changes: AdjustQuantitiesInput['changes'] = availabilities.reduce(
    (changes, { variantId, actualAvailability }) => {
      const variant = variants.find(({ sku }) => sku === variantId)

      if (
        !variant ||
        variant.inventoryQuantity === actualAvailability ||
        variant.inventoryQuantity < 1 ||
        actualAvailability > 0
      )
        return changes

      const inventoryItemId = variant.inventoryItem.id
      const quantities = [variant.inventoryQuantity, actualAvailability].map(toPositive)
      const delta = actualAvailability - variant.inventoryQuantity

      variantChanges.push({ variant, quantities, delta })

      return [...changes, { delta, inventoryItemId, locationId }]
    },
    [] as AdjustQuantitiesInput['changes']
  )

  if (!changes.length) {
    logger.notice('There are no changes to synchronize.')
    return
  }

  logger.info(`Adjusting quantity of ${changes.length} product variants...`)

  const input = { ...BASE_INPUT, changes }
  const { data: adjustData, errors } = await shopify.adjustQuantities({ input })

  if (!adjustData) {
    logger.error('No data returned from Shopify.')
    return exit(errors)
  }
  if (errors) {
    logger.error('An error occurred while adjusting quantities.')
    return exit(errors)
  }

  const { changes: inventoryChanges, createdAt } = adjustData.inventoryAdjustQuantities.inventoryAdjustmentGroup

  for (const change of inventoryChanges) {
    const variantChange = variantChanges.find(({ variant }) => variant.inventoryItem.id === change.item.id)
    if (!variantChange) continue

    logger.info(`✓ ${variantChange.variant.sku} ${variantChange.quantities.join(' → ')}`)
    logs.push(buildLog({ ...variantChange, delta: change.delta, date: createdAt }))
  }

  logger.notice(`Adjusted quantity of ${inventoryChanges.length} variants.`)

  if (logs.length) await airtable.createRecords<ActionLog>({ tableId: TABLE_ID, records: logs })
}
