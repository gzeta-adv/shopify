import { env } from '@/utils'

export const STORE_ID = env('SHOPIFY_STORE_ID')

export const API_VERSION = '2024-04'
export const RESOURCES_LIMIT = 250
export const OUTDATED_KEY = 'custom.obsoleta'

export const adminDomain = `admin.shopify.com/store/${STORE_ID}`
export const storeDomain = `${STORE_ID}.myshopify.com`
