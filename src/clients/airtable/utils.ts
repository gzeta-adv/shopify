import { BASE_URL, RUNS_TABLE_ID } from './data'
import { createRecords } from './records'
import { ActionRunPayload, ActionRunRecord, FieldSet, Records } from './types'

import { ActionError, ActionStatus } from '@/types'
import { exit as exitProcess, isCI, logger, titleize } from '@/utils'

const source = isCI ? 'GitHub Actions' : 'Local'

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
    Operations: payload.operations || '',
    Source: source,
    Event: titleize(payload.event || '', false) || undefined,
    Errors: payload.errors || '',
    Message: payload.message || '',
    Notes: payload.notes || '',
  } as ActionRunRecord

  return await createRecords({ tableId: RUNS_TABLE_ID, records: [log] })
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunSkip = async ({ action, message, ...rest }: ActionError, exit = false) => {
  await logActionRun(action, { status: ActionStatus.skipped, message, ...rest })
  exit ? exitProcess(message, 0) : logger.notice(message)
}

/**
 * Logs a successful action run and exits the process.
 */
export const logActionRunSuccess = async ({ action, message, ...rest }: ActionError, exit = false) => {
  await logActionRun(action, { status: ActionStatus.success, message, ...rest })
  exit ? exitProcess(message, 0) : logger.notice(message)
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunError = async ({ action, errors, message, ...rest }: ActionError, exit = true) => {
  const errorLog = JSON.stringify(errors, null, 2)
  await logActionRun(action, { status: ActionStatus.failed, errors: errorLog, message, ...rest })
  exit ? exitProcess(message) : logger.error(message)
}

/**
 * Logs multiple action runs using a given set of records.
 */
export const logActionRunFromRecords = async <T extends FieldSet>({
  action,
  records,
  event,
  message,
}: ActionError<Records<T>>): Promise<void> => {
  const operations = records
    ?.map((record, i) => `${i + 1}. [${record.id}](${BASE_URL}/${record._table.id}/${record.id})`)
    .join('\n')

  const run: ActionRunRecord = {
    Date: new Date().toISOString(),
    Status: ActionStatus.success,
    Action: action,
    Operations: operations,
    Source: source,
    Event: titleize(event || '', false) || undefined,
    Message: message,
  }

  await createRecords<ActionRunRecord>({ tableId: RUNS_TABLE_ID, records: [run] })

  if (message) logger.notice(message)
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
