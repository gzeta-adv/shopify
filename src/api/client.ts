import { createAdminApiClient } from '@shopify/admin-api-client'
import { env } from '@/utils'

const API_VERSION = '2024-04'
const STORE_DOMAIN = env('SHOPIFY_STORE_DOMAIN')
const ACCESS_TOKEN = env('SHOPIFY_ACCESS_TOKEN')

export const client = createAdminApiClient({
  apiVersion: API_VERSION,
  storeDomain: STORE_DOMAIN,
  accessToken: ACCESS_TOKEN,
})
