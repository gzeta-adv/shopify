import Airtable from 'airtable'
import { API_KEY, BASE_ID } from './data'

export const client = new Airtable({ apiKey: API_KEY }).base(BASE_ID)
