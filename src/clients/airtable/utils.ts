import { BASE_SHARED_ID, BASE_URL, RUNS_TABLE_ID } from './data'
import { createRecords } from './records'
import { ActionRunPayload, ActionRunRecord, FieldSet, Record, Records } from './types'

import { ActionError, ActionStatus } from '@/types'
import { isCI, logger, pluck, titleize } from '@/utils'

const source = isCI ? 'GitHub Actions' : 'Local'

/**
 * Returns the web URL of a given record.
 */
export const recordUrl = <T extends FieldSet>(record: Record<T>): string =>
  `${BASE_URL}/${BASE_SHARED_ID}/${record._table.name}/${record.id}`

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
    Source: source,
    Event: titleize(payload.event || '', false) || undefined,
    Errors: payload.errors || '',
    Message: payload.message || '',
    Notes: payload.notes || '',
  } as ActionRunRecord

  if (payload.lookup) log[payload.lookup] = payload.operations

  return await createRecords({ tableId: RUNS_TABLE_ID, records: [log] })
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunSkip = async ({ action, message, ...rest }: ActionError) => {
  logger.notice(message)
  await logActionRun(action, { status: ActionStatus.skipped, message, ...rest })
}

/**
 * Logs a successful action run and exits the process.
 */
export const logActionRunSuccess = async ({ action, message, ...rest }: ActionError) => {
  logger.notice(message)
  await logActionRun(action, { status: ActionStatus.success, message, ...rest })
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunError = async ({ action, errors, message, ...rest }: ActionError) => {
  const errorLog = JSON.stringify(errors, null, 2)
  logger.error(message)
  await logActionRun(action, { status: ActionStatus.failed, errors: errorLog, message, ...rest })
}

/**
 * Logs multiple action runs using a given set of records.
 */
export const logActionRunFromRecords = async <T extends FieldSet>({
  action,
  event,
  lookup,
  message,
  records,
}: ActionError<Records<T>>): Promise<void> => {
  const run: ActionRunRecord = {
    Date: new Date().toISOString(),
    Status: ActionStatus.success,
    Action: action,
    Source: source,
    Event: titleize(event || '', false) || undefined,
    Message: message,
  }

  if (lookup) run[lookup] = pluck(records || [], 'id')

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
