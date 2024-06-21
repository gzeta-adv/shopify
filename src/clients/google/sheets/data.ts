import { env } from '@/utils'

export const CLIENT_EMAIL = env('GOOGLE_SHEETS_CLIENT_EMAIL')
export const PRIVATE_KEY = env('GOOGLE_SHEETS_PRIVATE_KEY')
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

export const SPREADSHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d'
export const DEFAULT_RANGE = 'A1'

export const SPREADSHEET_ID = env('GOOGLE_SHEETS_SPREADSHEET_ID')
export const SYNC_COLLECTIONS_STATUS_SHEET = env(
  'GOOGLE_SHEETS_SYNC_COLLECTIONS_STATUS_SHEET',
  'Collection Status Operations'
)
export const SYNC_PRODUCTS_QUANTITY_SHEET = env(
  'GOOGLE_SHEETS_SYNC_PRODUCTS_QUANTITY_SHEET',
  'Product Quantity Operations'
)
