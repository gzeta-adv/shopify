import { env } from '@/utils'

export const BASE_ID = env('AIRTABLE_BASE_ID')
export const BASE_URL = `https://airtable.com/${BASE_ID}`
