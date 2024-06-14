import Airtable from 'airtable'
import { env } from '@/utils'
import { BASE_ID } from './data'

const API_KEY = env('AIRTABLE_API_KEY')

export const client = new Airtable({ apiKey: API_KEY }).base(BASE_ID)
