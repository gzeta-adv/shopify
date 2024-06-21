export const hyperlink = (url: string, text?: string) => {
  if (!text) return url
  return `=HYPERLINK("${url}", "${text}")`
}
