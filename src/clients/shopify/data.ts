import { env } from '@/utils'

export const STORE_ID = env('SHOPIFY_STORE_ID')
export const COLLECTION_METAFIELD = env('SHOPIFY_COLLECTION_METAFIELD')

export const API_VERSION = '2024-04'
export const RESOURCES_LIMIT = 250

export const adminDomain = `admin.shopify.com/store/${STORE_ID}`
export const storeDomain = `${STORE_ID}.myshopify.com`
