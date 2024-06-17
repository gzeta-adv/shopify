import airtable, { RUNS_TABLE_ID, actionLogger } from '@/clients/airtable'
import { Action } from '@/types'
import { pluck } from '@/utils'

const ACTION = 'Clean Airtable'
const RETENTION_DAYS = 7

export const cleanAirtable: Action = async ({ event }) => {
  const filterByFormula = `IS_BEFORE(Date, DATEADD(NOW(), -${RETENTION_DAYS}, "days"))`
  const logBase = { action: ACTION, event }

  try {
    const { records } = await airtable.fetchAllRecords(RUNS_TABLE_ID, { filterByFormula })
    const { records: deletedRecords } = await airtable.deleteRecords(RUNS_TABLE_ID, { records: pluck(records, 'id') })

    if (!deletedRecords) return await actionLogger.error({ ...logBase, errors: 'Unknown error' })
    if (!deletedRecords.length) return await actionLogger.skip({ ...logBase, message: 'No changes' })
    await actionLogger.success({ ...logBase, message: `Deleted ${deletedRecords.length} records` })
  } catch (error) {
    console.error(error)
  }
}
