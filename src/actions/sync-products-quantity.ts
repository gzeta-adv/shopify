import { exit } from 'process'
import sheets, { SHEETS, hyperlink } from '@@/google/sheets'
import shopify, { InventoryItem, LOCATION_ID, Product, ProductVariant, adminDomain } from '@@/shopify'
import { AdjustQuantitiesInput } from '@@/shopify/inventory/update'
import pim from '@/clients/pim'
import { Action, ActionLog, ActionStatus } from '@/types'
import { formatDate, logger, pluralize, toID, toPositive } from '@/utils'

const ACTION = 'Sync Products Quantity'

const BASE_INPUT = {
  reason: 'correction',
  name: 'available',
}

interface SyncProductsActionLog {
  Date: string
  Status: ActionStatus
  Product: string
  Variant: string
  'Previous Quantity': number
  'New Quantity': number
  Delta: number
  Message?: string
  Notes?: string
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

const productUrl = (product: Product): string => `https://${adminDomain}/products/${toID(product.id)}`

const variantUrl = (variant: Variant): string => `${productUrl(variant.product)}/variants/${toID(variant.id)}`

const variantName = (variant: Variant): string => variant.displayName.replace(`${variant.product.title} - `, '')

const buildSyncProductsActionLog = (change: VariantChange): SyncProductsActionLog => ({
  Date: formatDate(),
  Status: ActionStatus.success,
  Product: hyperlink(productUrl(change.variant.product), change.variant.product.title),
  Variant: hyperlink(variantUrl(change.variant), variantName(change.variant)),
  'Previous Quantity': change.quantities[0],
  'New Quantity': change.quantities[1],
  Delta: change.delta,
  Message: '',
  Notes: '',
})

/**
 * Synchronizes product quantities between the PIM and Shopify.
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
      await sheets.logFailedRun({ ...baseLog, message: 'No product variants found' })
      if (isLastRetry) exit()
      continue
    }

    const items = variants.map(({ sku }) => ({ variantId: sku }))
    const availabilities = await pim.verifyAvailability({ items })

    const updates = availabilities.reduce(
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

    const { data: changedData } = await shopify.fetchProductVariants<Variant>({
      ids: variantChanges.map(({ variant }) => variant.id),
    })
    const changedVariants = changedData?.productVariants?.edges || []

    const changes = updates.filter(({ inventoryItemId }) => {
      const variantChange = variantChanges.find(({ variant }) => variant.inventoryItem.id === inventoryItemId)
      const changedVariant = changedVariants.find(({ node }) => node.inventoryItem.id === inventoryItemId)
      return variantChange?.quantities[0] === changedVariant?.node.inventoryQuantity
    })

    const input = { ...BASE_INPUT, changes }
    const { data: adjustData, errors } = await shopify.adjustQuantities({ input })

    if (!adjustData || errors) {
      await sheets.logFailedRun({ ...baseLog, errors, message: 'Shopify API error' })
      if (isLastRetry) exit()
      continue
    }

    const { changes: inventoryChanges = [], createdAt } =
      adjustData.inventoryAdjustQuantities?.inventoryAdjustmentGroup || {}

    for (const change of inventoryChanges) {
      if (change.name !== BASE_INPUT.name) continue

      const variantChange = variantChanges.find(({ variant }) => variant.inventoryItem.id === change.item.id)
      if (!variantChange) continue

      logger.info(`✓ [${variantChange.variant.sku}] ${variantChange.quantities.join(' → ')}`)
      logs.push(buildSyncProductsActionLog({ ...variantChange, delta: change.delta, date: createdAt }))
    }

    const records = await sheets.appendRows<SyncProductsActionLog>({
      sheet: SHEETS.SyncProductsQuantity.name,
      values: logs,
    })
    await sheets.logRun({
      ...baseLog,
      status: ActionStatus.success,
      message: `Adjusted quantity of ${logs.length} product ${pluralize('variant', changes.length)}`,
      range: records.updates?.updatedRange,
    })
    exit()
  }
}
