import { client } from '#airtable'

import type { FieldSet, Records } from '#airtable'
import { chunks } from '@/utils'

interface CreateRecordsOptions<T extends FieldSet> {
  tableId: string
  records: T[]
}

export const createRecords = async <T extends FieldSet>({
  tableId,
  records,
}: CreateRecordsOptions<T>): Promise<Records<T>> => {
  const recordFields = records.map(record => ({ fields: record }))
  const recordChunks = chunks(recordFields, 10)

  const results = await Promise.all(recordChunks.map(chunk => client<T>(tableId).create(chunk, { typecast: true })))
  return results.flat()
}
