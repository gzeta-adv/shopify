import { BASE_URL, RUNS_TABLE_ID } from './data'
import { createRecords } from './records'
import { ActionRunPayload, ActionRunRecord, FieldSet, Records } from './types'

import { ActionError, ActionStatus } from '@/types'
import { exit as exitProcess, logger } from '@/utils'

/**
 * Logs a action run using a given payload.
 */
export const logActionRun = async <T extends ActionRunPayload>(
  action: string,
  payload: T
): Promise<Records<ActionRunRecord>> => {
  const log = {
    Date: new Date().toISOString(),
    Status: payload.status,
    Action: action,
    Errors: payload.errors || '',
    Message: payload.message || '',
    Notes: payload.notes || '',
  } as ActionRunRecord

  return await createRecords({ tableId: RUNS_TABLE_ID, records: [log] })
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunSkip = async ({ action, message }: ActionError, exit = false) => {
  await logActionRun(action, { status: ActionStatus.skipped, message })
  exit ? exitProcess(message, 0) : logger.notice(message)
}

export const logActionRunSuccess = async ({ action, message }: ActionError, exit = false) => {
  await logActionRun(action, { status: ActionStatus.success, message })
  exit ? exitProcess(message, 0) : logger.notice(message)
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunError = async ({ action, errors, message }: ActionError, exit = true) => {
  const errorLog = JSON.stringify(errors, null, 2)
  await logActionRun(action, { status: ActionStatus.failed, errors: errorLog, message })
  exit ? exitProcess(message) : logger.error(message)
}

/**
 * Logs multiple action runs using a given set of records.
 */
export const logActionRunFromRecords = async <T extends FieldSet>({
  action,
  records,
}: ActionError<Records<T>>): Promise<Records<ActionRunRecord>> => {
  const operations = records?.map(record => `${BASE_URL}/${RUNS_TABLE_ID}/${record.id}`).join('\n')

  const run: ActionRunRecord = {
    Date: new Date().toISOString(),
    Status: ActionStatus.success,
    Action: action,
    Operations: operations,
  }

  return await createRecords<ActionRunRecord>({ tableId: RUNS_TABLE_ID, records: [run] })
}

/**
 * Action logger utilities.
 */
export const actionLogger = {
  run: logActionRun,
  skip: logActionRunSkip,
  error: logActionRunError,
  success: logActionRunSuccess,
  fromRecords: logActionRunFromRecords,
}
