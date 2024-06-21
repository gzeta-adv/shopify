import { SHEETS, SPREADSHEET_BASE_URL, SPREADSHEET_ID } from '@/clients/google/sheets/data'

export const hyperlink = (url: string, text?: string) => {
  if (!text) return url
  return `=HYPERLINK("${url}", "${text}")`
}

export const rangeHyperlink = (range: string, text?: string) => {
  if (!text) text = range

  const [sheetName, cellRange] = range.split('!').map(s => s.replace(/'/g, ''))
  const sheetKey = Object.keys(SHEETS).find(key => SHEETS[key as keyof typeof SHEETS]?.name === sheetName)
  const gid = sheetKey ? SHEETS[sheetKey as keyof typeof SHEETS].id : 0
  const url = `${SPREADSHEET_BASE_URL}/${SPREADSHEET_ID}#gid=${gid}&range=${cellRange}`

  return hyperlink(url, text)
}
