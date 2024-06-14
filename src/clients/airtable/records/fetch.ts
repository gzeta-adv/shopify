import { FieldSet, Record, client } from '@/clients/airtable'
import { RequestMethod } from '@/types'

interface FetchRecordsParams {
  fields?: string[]
  filterByFormula?: string
  maxRecords?: number
  offset?: string
  sort?: {
    field: string
    direction?: 'asc' | 'desc'
  }[]
}

interface FetchRecordsResponse<T extends FieldSet> {
  records: Record<T>[]
  offset?: string
}

/**
 * Fetches records from an Airtable table.
 */
export const fetchRecords = async <T extends FieldSet>(
  tableId: string,
  params: FetchRecordsParams = {}
): Promise<FetchRecordsResponse<T>> => {
  const options = { path: `/${tableId}`, qs: params, method: RequestMethod.GET }
  const response = await client.makeRequest(options)
  return response.body
}

/**
 * Fetches all records from an Airtable table.
 */
export const fetchAllRecords = async <T extends FieldSet>(
  tableId: string,
  params: FetchRecordsParams = {}
): Promise<FetchRecordsResponse<T>> => {
  const records = []
  let offset: string | undefined = ''

  while (offset !== undefined) {
    if (offset) params.offset = offset
    const { records: pageRecords, offset: pageOffset } = await fetchRecords<T>(tableId, params)
    if (!pageRecords.length) break
    records.push(...pageRecords)
    offset = pageOffset
  }

  return { records }
}
