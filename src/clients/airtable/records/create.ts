import { client } from '@/clients/airtable'
import { chunks } from '@/utils'

import type { FieldSet, Records } from '@/clients/airtable'

const RECORDS_LIMIT = 10

interface CreateRecordsOptions<T extends FieldSet> {
  tableId: string
  records: T[]
}

export const createRecords = async <T extends FieldSet>({
  tableId,
  records,
}: CreateRecordsOptions<T>): Promise<Records<T>> => {
  const recordFields = records.map(record => ({ fields: record }))
  const recordChunks = chunks(recordFields, RECORDS_LIMIT)

  try {
    const results = await Promise.all(recordChunks.map(chunk => client<T>(tableId).create(chunk, { typecast: true })))
    return results.flat()
  } catch (e) {
    console.error(e)
    return []
  }
}
