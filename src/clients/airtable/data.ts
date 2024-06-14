import { env } from '@/utils'

export const API_KEY = env('AIRTABLE_API_KEY')
export const BASE_ID = env('AIRTABLE_BASE_ID')
export const BASE_URL = `https://airtable.com/${BASE_ID}`
export const BASE_API_URL = `https://api.airtable.com/v0/${BASE_ID}`

export const COLLECTION_STATUS_TABLE_ID = env('AIRTABLE_COLLECTION_STATUS_TABLE_ID')
export const PRODUCT_QUANTITY_TABLE_ID = env('AIRTABLE_PRODUCT_QUANTITY_TABLE_ID')
export const RUNS_TABLE_ID = env('AIRTABLE_RUNS_TABLE_ID')
