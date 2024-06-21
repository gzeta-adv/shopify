import { ActionRunPayload, ActionRunRecord, ActionLog, ActionStatus } from '@/types'
import { BASE_SHARED_ID, BASE_URL, RUNS_TABLE_ID } from './data'
import { createRecords } from './records'
import { FieldSet, Record, Records } from './types'

import { getActionRunURL, isCI, logger, pluck, titleize } from '@/utils'

const source = isCI ? 'GitHub Actions' : 'Local'

interface AirtableActionRunPayload extends ActionRunPayload {
  lookup?: string
}

interface AirtableActionRunRecord extends FieldSet, ActionRunRecord {
  'Product Quantity Operations'?: string[]
  'Collection Status Operations'?: string[]
}

/**
 * Returns the web URL of a given record.
 */
export const recordUrl = <T extends FieldSet>(record: Record<T>): string =>
  `${BASE_URL}/${BASE_SHARED_ID}/${record._table.name}/${record.id}`

/**
 * Logs a action run using a given payload.
 */
export const logActionRun = async <T extends AirtableActionRunPayload>(
  action: string,
  payload: T
): Promise<Records<AirtableActionRunRecord>> => {
  const log: AirtableActionRunRecord = {
    Date: new Date().toISOString(),
    Status: payload.status || ActionStatus.success,
    Action: action,
    Source: source,
    Event: titleize(payload.event || '', false) || undefined,
    'GitHub Run': payload.runId ? getActionRunURL(payload.runId) : undefined,
    Retry: payload.retry || undefined,
    Errors: payload.errors || '',
    Message: payload.message || '',
    Notes: payload.notes || '',
  }

  if (payload.lookup) log[payload.lookup] = payload.operations

  return await createRecords({ tableId: RUNS_TABLE_ID, records: [log] })
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunSkip = async ({ action, message, ...rest }: ActionLog) => {
  logger.notice(message)
  await logActionRun(action, { status: ActionStatus.skipped, message, ...rest })
}

/**
 * Logs a successful action run and exits the process.
 */
export const logActionRunSuccess = async ({ action, message, ...rest }: ActionLog) => {
  logger.notice(message)
  await logActionRun(action, { status: ActionStatus.success, message, ...rest })
}

/**
 * Logs a failed action run and exits the process.
 */
export const logActionRunError = async ({ action, errors, message, ...rest }: ActionLog) => {
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
  runId,
}: ActionLog<Records<T>>): Promise<void> => {
  const run: AirtableActionRunRecord = {
    Date: new Date().toISOString(),
    Status: ActionStatus.success,
    Action: action,
    Source: source,
    Event: titleize(event || '', false) || undefined,
    'GitHub Run': runId ? getActionRunURL(runId) : undefined,
    Message: message,
  }

  if (lookup) run[lookup] = pluck(records || [], 'id')

  await createRecords<AirtableActionRunRecord>({ tableId: RUNS_TABLE_ID, records: [run] })

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
