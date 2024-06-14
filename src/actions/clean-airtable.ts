import airtable, { RUNS_TABLE_ID, actionLogger } from '@/clients/airtable'
import { Action } from '@/types'
import { pluck } from '@/utils'

const ACTION = 'Clean Airtable'
const RETENTION_DAYS = 10

export const cleanAirtable: Action = async () => {
  try {
    const filterByFormula = `IS_BEFORE(Date, DATEADD(NOW(), -${RETENTION_DAYS}, "days"))`
    const { records } = await airtable.fetchAllRecords(RUNS_TABLE_ID, { filterByFormula })
    const { records: deletedRecords } = await airtable.deleteRecords(RUNS_TABLE_ID, { records: pluck(records, 'id') })

    if (!deletedRecords) return await actionLogger.error({ action: ACTION, errors: 'Unknown error' })
    if (!deletedRecords.length) return await actionLogger.skip({ action: ACTION, message: 'No records to delete.' })
    await actionLogger.success({ action: ACTION, message: `Deleted ${deletedRecords.length} records.` })
  } catch (error) {
    console.error(error)
  }
}
