import sheets, { AppendRowResponse, SHEETS, SPREADSHEET_ID, hyperlink, rangeHyperlink } from '@@/google/sheets'
import { ActionRunPayload, ActionStatus } from '@/types'
import { formatDate, getActionRunURL, isCI, logger, titleize } from '@/utils'

const source = isCI ? 'GitHub Actions' : 'Local'

/**
 * Logs an action run to a specified sheet.
 */
export const logRun = async <T extends ActionRunPayload>(payload: T): Promise<AppendRowResponse> => {
  const sheet = payload.sheet || SHEETS.Runs.name
  if (payload.range) payload.operations = rangeHyperlink(payload.range)
  const githubRun = payload.runId ? hyperlink(getActionRunURL(payload.runId), payload.runId) : ''

  const log = {
    Date: formatDate(),
    Status: payload.status,
    Action: payload.action,
    Operations: payload.operations,
    Source: source,
    Event: titleize(payload.event || '', false),
    'GitHub Run': githubRun,
    Message: payload.message,
    Errors: JSON.stringify(payload.errors),
    Notes: payload.notes,
  }

  return await sheets.appendRows({ spreadsheetId: SPREADSHEET_ID, sheet, values: [log] })
}

/**
 * Logs a successful action run to the Google Sheet.
 */
export const logSuccessRun = async (payload: ActionRunPayload) => {
  if (payload.message) logger.notice(payload.message)
  await logRun({ ...payload, status: ActionStatus.success })
}
/**
 * Logs a failed action run to the Google Sheet.
 */
export const logFailedRun = async (payload: ActionRunPayload) => {
  if (payload.message) logger.error(payload.message)
  await logRun({ ...payload, status: ActionStatus.failed })
}
/**
 * Logs a skipped action run to the Google Sheet.
 */
export const logSkippedRun = async (payload: ActionRunPayload) => {
  if (payload.message) logger.notice(payload.message)
  await logRun({ ...payload, status: ActionStatus.skipped })
}
