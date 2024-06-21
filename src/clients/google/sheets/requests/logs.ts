import sheets, {
  AppendRowResponse,
  SPREADSHEET_ID,
  SYNC_COLLECTIONS_STATUS_SHEET,
  SYNC_PRODUCTS_QUANTITY_SHEET,
  hyperlink,
} from '@@/google/sheets'
import { ActionPayload, ActionStatus, BaseObject } from '@/types'
import { formatDate, getActionRunURL, isCI, logger, titleize } from '@/utils'

const source = isCI ? 'GitHub Actions' : 'Local'

interface SyncCollectionsStatusPayload extends ActionPayload {
  action?: 'publish' | 'unpublish'
  collection?: string
  products?: number
  previous?: number
  new?: number
}

interface SyncCollectionsStatusLog {
  Action?: 'Publish' | 'Unpublish'
  Collection?: string
  Products?: number
  'Previous Publications'?: number
  'New Publications'?: number
}

interface SyncProductsQuantityPayload extends ActionPayload {
  product?: string
  variant?: string
  previous?: number
  new?: number
  delta?: number
}

interface SyncProductsQuantityLog {
  Product?: string
  Variant?: string
  'Previous Quantity'?: number
  'New Quantity'?: number
  Delta?: number
}

/**
 * Appends an action log with arbitrary fields to the Google Sheet.
 */
export const appendActionLog = async <T extends BaseObject>(
  sheet: string,
  payload: ActionPayload,
  log: T
): Promise<AppendRowResponse> => {
  const values = [
    {
      Date: formatDate(),
      Status: payload.status || ActionStatus.success,
      Source: source,
      Event: titleize(payload.event || '', false),
      'GitHub Run': payload.runId ? hyperlink(getActionRunURL(payload.runId), payload.runId) : '',
      ...log,
      Message: payload.message,
      Errors: JSON.stringify(payload.errors),
      Notes: undefined,
    },
  ]
  const response = await sheets.appendRows({ spreadsheetId: SPREADSHEET_ID, sheet, values })
  if (payload.message) logger[payload.status === ActionStatus.failed ? 'error' : 'notice'](payload.message)
  return response
}

/**
 * Logs the `sync-collections-status` action to Google Sheets.
 */
export const logSyncCollectionsStatus = async (payload: SyncCollectionsStatusPayload) =>
  appendActionLog<SyncCollectionsStatusLog>(SYNC_COLLECTIONS_STATUS_SHEET, payload, {
    Action: titleize(payload.action || '') as 'Publish' | 'Unpublish',
    Collection: payload.collection,
    Products: payload.products,
    'Previous Publications': payload.previous,
    'New Publications': payload.new,
  })

/**
 * Logs the `sync-products-quantity` action to the Google Sheet.
 */
export const logSyncProductsQuantity = async (payload: SyncProductsQuantityPayload) =>
  appendActionLog<SyncProductsQuantityLog>(SYNC_PRODUCTS_QUANTITY_SHEET, payload, {
    Product: payload.product,
    Variant: payload.variant,
    'Previous Quantity': payload.previous,
    'New Quantity': payload.new,
    Delta: payload.delta,
  })
