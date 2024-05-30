import Airtable from 'airtable'
import { env } from '@/utils'

const API_KEY = env('AIRTABLE_API_KEY')
const BASE_ID = env('AIRTABLE_BASE_ID')

export const client = new Airtable({ apiKey: API_KEY }).base(BASE_ID)
