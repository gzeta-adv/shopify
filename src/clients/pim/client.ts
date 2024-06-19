import { API_URL, VERIFY_ENDPOINT } from './data'
import fetch from './requests/fetch'
import { verifyAvailability } from './requests/verify-availability'
import { env } from '@/utils'

const API_TOKEN = env('PIM_TOKEN')

export const client = {
  apiUrl: API_URL,
  apiToken: API_TOKEN,
  endpoints: {
    verify: VERIFY_ENDPOINT,
  },
  fetch,
  verifyAvailability,
}
