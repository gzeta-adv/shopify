import { sheets_v4 } from '@googleapis/sheets'
import { DEFAULT_RANGE, SPREADSHEET_ID, client } from '@@/google/sheets'

/**
 * Append rows to a table in the specified sheet.
 */
export interface AppendRowOptions<T extends Record<string, any> | any[]>
  extends sheets_v4.Params$Resource$Spreadsheets$Values$Append {
  range?: string
  spreadsheetId?: string
  sheet?: string
  values: Array<T>
}

/**
 * The response from appending rows to a table in a sheet.
 */
export interface AppendRowResponse extends sheets_v4.Schema$AppendValuesResponse {}

/**
 * Appends rows to a table in a specified sheet.
 */
export const appendRows = async <T extends Record<string, any> | any[]>({
  range = DEFAULT_RANGE,
  spreadsheetId = SPREADSHEET_ID,
  sheet,
  values,
  ...opts
}: AppendRowOptions<T>): Promise<AppendRowResponse> => {
  if (sheet) range = `${sheet}!${range}`
  values = values.map(value => (Array.isArray(value) ? value : Object.values(value))) as any[]

  return (
    await client.values.append({
      includeValuesInResponse: true,
      range,
      requestBody: { range, values: values as any[][] },
      spreadsheetId,
      valueInputOption: 'USER_ENTERED',
      ...opts,
    })
  ).data
}
