import { env } from '@/utils'

export const CLIENT_EMAIL = env('GOOGLE_SHEETS_CLIENT_EMAIL')
export const PRIVATE_KEY = env('GOOGLE_SHEETS_PRIVATE_KEY')
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

export const SPREADSHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d'
export const DEFAULT_RANGE = 'A1'

export const SPREADSHEET_ID = env('GOOGLE_SHEETS_SPREADSHEET_ID')

export const SHEETS = {
  SyncCollectionsStatus: {
    id: env('GOOGLE_SHEETS_SYNC_COLLECTIONS_STATUS_SHEET_ID', 0),
    name: env('GOOGLE_SHEETS_SYNC_COLLECTIONS_STATUS_SHEET_NAME', 'Collection Status Operations'),
  },
  SyncProductsQuantity: {
    id: env('GOOGLE_SHEETS_SYNC_PRODUCTS_QUANTITY_SHEET_ID', 0),
    name: env('GOOGLE_SHEETS_SYNC_PRODUCTS_QUANTITY_SHEET_NAME', 'Product Quantity Operations'),
  },
  Runs: {
    id: env('GOOGLE_SHEETS_RUNS_SHEET_ID', 0),
    name: env('GOOGLE_SHEETS_RUNS_SHEET_NAME', 'Runs'),
  },
}
