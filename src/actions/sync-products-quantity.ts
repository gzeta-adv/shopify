import { exit } from 'process'
import airtable, { FieldSet, PRODUCT_QUANTITY_TABLE_ID, actionLogger } from '@/clients/airtable'
import shopify, { InventoryItem, LOCATION_ID, Product, ProductVariant, adminDomain } from '@/clients/shopify'
import { AdjustQuantitiesInput } from '@/clients/shopify/inventory'
import wikini from '@/clients/wikini'
import { Action, ActionLog, ActionStatus } from '@/types'
import { logger, pluralize, toID, toPositive } from '@/utils'

const ACTION = 'Sync Products Quantity'

const BASE_INPUT = {
  reason: 'correction',
  name: 'available',
}

interface SyncProductsActionLog extends FieldSet {
  Date: string
  Status: ActionStatus
  'Product ID': number
  'Product Title': string
  'Variant ID': number
  'Variant SKU': string
  'Variant Name': string
  'Variant URL': string
  'Previous Quantity': number
  'New Quantity': number
  Delta: number
}

interface Variant extends ProductVariant {
  sku: string
  displayName: string
  product: Product
  inventoryQuantity: number
  inventoryItem: InventoryItem
}

interface VariantChange {
  date?: string
  variant: Variant
  quantities: number[]
  delta: number
}

const variantUrl = (variant: Variant): string =>
  `https://${adminDomain}/products/${toID(variant.product.id)}/variants/${toID(variant.id)}`

const buildSyncProductsActionLog = (change: VariantChange): SyncProductsActionLog => ({
  Date: change.date || new Date().toISOString(),
  Status: ActionStatus.success,
  'Product ID': toID(change.variant.product.id),
  'Product Title': change.variant.product?.title,
  'Variant ID': toID(change.variant.id),
  'Variant SKU': change.variant.sku,
  'Variant Name': change.variant.displayName.replace(`${change.variant.product.title} - `, ''),
  'Variant URL': variantUrl(change.variant),
  'Previous Quantity': change.quantities[0],
  'New Quantity': change.quantities[1],
  Delta: change.delta,
})

/**
 * Synchronizes product quantities between the Wikini CMS and Shopify.
 */
export const syncProductsQuantity: Action = async ({ event, retries, runId }) => {
  for (const i of Array(retries).keys()) {
    const variantChanges: VariantChange[] = []
    const logs: SyncProductsActionLog[] = []
    const isLastRetry = i === retries - 1
    const retry = retries > 1 ? `${i + 1}/${retries}` : undefined

    const baseLog: ActionLog = {
      event,
      action: ACTION,
      retry,
      runId,
    }

    const location = await shopify.fetchPrimaryLocation()
    const locationId = location?.id || LOCATION_ID

    const { data } = await shopify.fetchAllProductVariants<Variant>()
    const variants = data?.productVariants?.edges || []

    if (!variants.length) {
      await actionLogger.error({ ...baseLog, message: 'No product variants found' })
      if (isLastRetry) exit()
      continue
    }

    const items = variants.map(({ sku }) => ({ variantId: sku }))
    const availabilities = await wikini.verifyAvailability({ items })

    const changes: AdjustQuantitiesInput['changes'] = availabilities.reduce(
      (changes, { variantId, actualAvailability }) => {
        const variant = variants.find(({ sku }) => sku === variantId)

        if (!variant) return changes

        const { inventoryItem, inventoryQuantity } = variant
        const isDuplicate = changes.some(({ inventoryItemId }) => inventoryItemId === inventoryItem.id)

        if (inventoryQuantity === actualAvailability || inventoryQuantity < 1 || actualAvailability > 0 || isDuplicate)
          return changes

        const quantities = [inventoryQuantity, actualAvailability].map(toPositive)
        const delta = actualAvailability - inventoryQuantity

        variantChanges.push({ variant, quantities, delta })

        return [...changes, { delta, inventoryItemId: inventoryItem.id, locationId }]
      },
      [] as AdjustQuantitiesInput['changes']
    )

    if (!changes.length) {
      await actionLogger.skip({ ...baseLog, message: 'No changes' })
      if (isLastRetry) exit()
      continue
    }

    const input = { ...BASE_INPUT, changes }
    const { data: adjustData, errors } = await shopify.adjustQuantities({ input })

    if (!adjustData || errors) {
      await actionLogger.error({ ...baseLog, errors, message: 'Shopify API error' })
      if (isLastRetry) exit()
      continue
    }

    const { changes: inventoryChanges, createdAt } = adjustData.inventoryAdjustQuantities.inventoryAdjustmentGroup

    for (const change of inventoryChanges) {
      if (change.name !== BASE_INPUT.name) continue

      const variantChange = variantChanges.find(({ variant }) => variant.inventoryItem.id === change.item.id)
      if (!variantChange) continue

      logger.info(`✓ [${variantChange.variant.sku}] ${variantChange.quantities.join(' → ')}`)
      logs.push(buildSyncProductsActionLog({ ...variantChange, delta: change.delta, date: createdAt }))
    }

    const records = await airtable.createRecords<SyncProductsActionLog>({
      tableId: PRODUCT_QUANTITY_TABLE_ID,
      records: logs,
    })

    await actionLogger.fromRecords({
      ...baseLog,
      lookup: 'Product Quantity Operations',
      message: `Adjusted quantity of ${logs.length} product ${pluralize('variant', changes.length)}`,
      records,
    })
    exit()
  }
}
