import sheets, { hyperlink } from '@@/google/sheets'
import shopify, { InventoryItem, LOCATION_ID, Product, ProductVariant, adminDomain, isThrottled } from '@@/shopify'
import { AdjustQuantitiesInput } from '@@/shopify/inventory/update'
import pim from '@/clients/pim'
import { Action, ActionPayload, ActionStatus } from '@/types'
import { logger, pluralize, toID } from '@/utils'

const BASE_INPUT = {
  reason: 'correction',
  name: 'available',
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
const productHyperlink = (product: Product) => hyperlink(productUrl(product), product.title)
const variantUrl = (variant: Variant): string => `${productUrl(variant.product)}/variants/${toID(variant.id)}`
const variantName = (variant: Variant): string => variant.displayName.replace(`${variant.product.title} - `, '')
const variantHyperlink = (variant: Variant) => hyperlink(variantUrl(variant), variantName(variant))

/**
 * Synchronizes product quantities between the PIM and Shopify.
 */
export const syncProductsQuantity: Action = async ({ event, retries, runId }) => {
  let updatesCount = 0

  for (const i of Array(retries).keys()) {
    const variantChanges: VariantChange[] = []
    const isLastRetry = i === retries - 1

    const baseLog: ActionPayload = { event, runId }

    const location = await shopify.fetchPrimaryLocation()
    const locationId = location?.id || LOCATION_ID

    const { data } = await shopify.fetchAllProductVariants<Variant>()
    const variants = data?.productVariants?.edges || []

    if (!variants.length) {
      await sheets.logSyncProductsQuantity({
        ...baseLog,
        status: ActionStatus.failed,
        message: 'No product variants found',
      })
      if (isLastRetry) break
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

        const quantities = [inventoryQuantity, actualAvailability]
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
      if (errors && !isThrottled(errors)) {
        await sheets.logSyncProductsQuantity({
          ...baseLog,
          status: ActionStatus.failed,
          errors,
          message: 'Shopify API error',
        })
      }
      if (isLastRetry) break
      continue
    }

    const { changes: inventoryChanges = [] } = adjustData.inventoryAdjustQuantities?.inventoryAdjustmentGroup || {}

    for (const change of inventoryChanges) {
      if (change.name !== BASE_INPUT.name) continue

      const variantChange = variantChanges.find(({ variant }) => variant.inventoryItem.id === change.item.id)
      if (!variantChange) continue

      logger.info(`✓ [${variantChange.variant.sku}] ${variantChange.quantities.join(' → ')}`)
      await sheets.logSyncProductsQuantity({
        ...baseLog,
        status: ActionStatus.success,
        product: productHyperlink(variantChange.variant.product),
        variant: variantHyperlink(variantChange.variant),
        previous: variantChange.quantities[0],
        new: variantChange.quantities[1],
        delta: change.delta,
      })
      updatesCount++
    }
  }

  logger.notice(
    updatesCount ? `\nAdjusted quantity of ${updatesCount} product ${pluralize('variant', updatesCount)}` : 'No changes'
  )
}
