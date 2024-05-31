import { createAdminApiClient } from '@shopify/admin-api-client'
import { API_VERSION, storeDomain } from './data'
import { env } from '@/utils'

export const ACCESS_TOKEN = env('SHOPIFY_ACCESS_TOKEN')

console.log('storeDomain:', storeDomain)
console.log('ACCESS_TOKEN:', ACCESS_TOKEN)
console.log('API_VERSION:', API_VERSION)

export const client = createAdminApiClient({
  apiVersion: API_VERSION,
  storeDomain,
  accessToken: ACCESS_TOKEN,
})
