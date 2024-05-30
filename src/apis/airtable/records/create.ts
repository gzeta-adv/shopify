import { client } from '#airtable'

import type { FieldSet, Records } from '#airtable'

export interface CreateRecordsOptions<T extends FieldSet> {
  tableId: string
  records: T[]
}

export const createRecords = async <T extends FieldSet>({
  tableId,
  records,
}: CreateRecordsOptions<T>): Promise<Records<T>> => {
  const recordFields = records.map(record => ({ fields: record }))
  try {
    return await client<T>(tableId).create(recordFields, { typecast: true })
  } catch (error) {
    console.error(error)
    return []
  }
}
