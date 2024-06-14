import { FieldSet, client } from '@/clients/airtable'
import { fetchAllRecords } from '@/clients/airtable/records/fetch'
import { RequestMethod } from '@/types'
import { chunks, pluck } from '@/utils'

interface DeleteRecordsParams {
  /**
   * The recordIds of each record to be deleted. Up to 10 recordIds can be provided.
   */
  records: string[]
}

interface DeleteRecordsResponse {
  records: {
    id: string
    deleted: boolean
  }[]
}

/**
 * Deletes records from an Airtable table.
 */
export const deleteRecords = async (tableId: string, params: DeleteRecordsParams): Promise<DeleteRecordsResponse> => {
  const baseOptions = { path: `/${tableId}`, method: RequestMethod.DELETE }
  const records: DeleteRecordsResponse['records'] = []

  for (const recordIds of chunks(params.records, 10)) {
    const options = { ...baseOptions, qs: { records: recordIds } }
    const { body }: { body: DeleteRecordsResponse } = await client.makeRequest(options)
    records.push(...body.records)
  }

  return { records }
}

/**
 * Deletes all records from an Airtable table.
 */
export const deleteAllRecords = async <T extends FieldSet>(tableId: string): Promise<DeleteRecordsResponse> => {
  const { records } = await fetchAllRecords<T>(tableId)
  return await deleteRecords(tableId, { records: pluck(records, 'id') })
}
