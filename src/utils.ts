import parseArgs from 'yargs-parser'
import { MAX_RETRIES, RETRIES, repositoryUrl } from '@/data'
import { ActionArgs, ActionEvent, ActionOptions } from '@/types'
import pluralize from 'pluralize'

export { default as pluralize } from 'pluralize'

/**
 * Gets an environment variable or a fallback value.
 */
export const env = <T>(key: string, fallback?: T): string => process.env[key] ?? JSON.stringify(fallback)

/**
 * Checks if the current environment is test.
 */
export const isDevelopment = env('NODE_ENV') === 'development'

/**
 * Checks if the current environment is CI.
 */
export const isCI = env('CI') === 'true' || env('GITHUB_ACTIONS') === 'true'

/**
 * Logs a message and exit the process.
 */
export const exit = (message?: any, code = 1): void => {
  if (message) {
    code === 1 ? logger.error(message) : logger.notice(message)
  }
  process.exit(code)
}

/**
 * Checks if the current environment is GitHub Actions.
 */
const isGithubActions = env('GITHUB_ACTIONS') === 'true'

/**
 * Logger with support for GitHub Actions annotations.
 */
/* eslint-disable no-console */
export const logger = {
  error: (...data: any[]): void => (isGithubActions ? console.error('::error::', ...data) : console.error(...data)),
  info: (...data: any[]): void => console.info(...data),
  notice: (...data: any[]): void => (isGithubActions ? console.info('::notice::', ...data) : console.info(...data)),
  warning: (...data: any[]): void => (isGithubActions ? console.warn('::warning::', ...data) : console.warn(...data)),
  time: (label?: string): void => console.time(label),
  timeEnd: (label?: string): void => console.timeEnd(label),
}

/**
 * Plucks a key from an array of objects.
 */
export const pluck = <A extends Record<string, any>, K extends string>(array: A[], key: K): A[K][] =>
  array.map(el => el[key])

/**
 * Generates an array of numbers in a given range.
 */
export const range = (start: number, stop: number, step = 1): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

/**
 * Converts an array of items into a human-readable sentence.
 */
export const sentencize = (array: any[]): string => new Intl.ListFormat().format(array)

/**
 * Performs an action `n` times and return the results.
 */
export const times = async <T>(n: number, callback: (i: number) => T): Promise<T[]> =>
  Promise.all(range(1, n).map(i => callback(i)))

/**
 * Converts a Shopify ID to a number ID.
 */
export const toID = (shopifyID: string): number => parseInt(shopifyID.split('/').pop() as string, 10)

/**
 * Convertss a string to title case.
 */
export const titleize = (string?: string, capitalize = true): string => {
  if (!string) return ''

  const title = string
    .replace(/_|-|:/g, ' ')
    .replace(/[A-Z]/g, m => ` ${m}`)
    .trim()

  if (capitalize) return title.replace(/\b\w/g, c => c.toUpperCase())
  return `${title.charAt(0).toUpperCase()}${title.slice(1)}`
}

/**
 * Converts a string to camelCase.
 */
export const toCamelCase = (s: string): string => s.toLowerCase().replace(/([-_:]+\w)/g, m => m.slice(-1).toUpperCase())

/**
 * Converts a string to kebab-case.
 */
export const toKebabCase = (s: string): string =>
  s
    .replace(/[A-Z]/g, m => `-${m}`)
    .toLowerCase()
    .replace(/_/g, () => '-')

/**
 * Converts a string to snake_case.
 */
export const toSnakeCase = (s: string): string =>
  s
    .replace(/[A-Z]/g, m => `_${m}`)
    .toLowerCase()
    .replace(/-/g, () => '_')

/**
 * Capitalizes the first letter of a string.
 */
export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Resolves nodes from a GraphQL response.
 */
export const resolveNodes = <T extends Record<string, any>>(nodes: T[]): T[] =>
  nodes.map(node => {
    for (const key of Object.keys(node)) {
      const nodeValue = node[key as keyof typeof node]

      if (Object.hasOwn(nodeValue, 'edges')) {
        const newNodeValue = nodeValue.edges.map(({ node }: { node: T }) => node)
        // @ts-expect-error - key is a valid key of node
        node[key] = Array.isArray(newNodeValue) ? resolveNodes(newNodeValue) : newNodeValue
      }
    }
    return node
  })

/**
 * Resolves edges from a GraphQL response.
 */
export const resolveEdges = <T extends Record<string, any>>(edges: T[]): T[] => edges.map(edge => edge.node)

/**
 * Splits an array into chunks of a given size.
 */
export const chunks = <T>(array: T[], size: number = 1): T[][] => {
  const results = []
  while (array.length) {
    results.push(array.splice(0, size))
  }
  return results
}

/**
 * Prints a message with the available actions.
 */
export const actionsMessage = (actions: Record<string, any>) =>
  `Available actions are ${sentencize(Object.keys(actions).map(toKebabCase).sort())}.`

/**
 * Prints a message with the available action arguments.
 */
export const argsMessage = (opt: any) => `Error: unknown ${pluralize('argument', opt?.length)} ${opt}
Available options:
  --event      ${Object.keys(ActionEvent).join(', ')}
  --retries    1-${MAX_RETRIES}
  --runId      <string>`

/**
 * Parses the action arguments.
 */
export const parseActionArgs = (args: string[]): ActionOptions => {
  const parsed = parseArgs(args)
  const retriesMsg = `Error: --retries must be a number between 1 and ${MAX_RETRIES}`

  const opts = Object.keys(parsed).reduce((acc, key) => {
    let value = parsed[key]

    if (!Object.hasOwn(ActionArgs, key)) {
      if (key === '_') {
        if (value.length) exit(argsMessage(value.join(' ')))
        return acc
      }
      exit(argsMessage(key))
    }
    if (key === ActionArgs.event && !Object.hasOwn(ActionEvent, value)) {
      exit(argsMessage(value))
    }
    if (key === ActionArgs.retries) {
      if (isNaN(value) || value < 1) exit(retriesMsg)
      value = parseInt(value)
    }

    return { ...acc, [key]: value }
  }, {} as ActionOptions)

  if (!opts.event) opts.event = isDevelopment ? ActionEvent.test : ActionEvent.local_dispatch
  opts.retries = opts.retries || RETRIES
  if (opts.retries > MAX_RETRIES) exit(retriesMsg)

  return opts
}

/**
 * Returns a link to the given GitHub Actions run.
 */
export const getActionRunURL = (runId?: string): string => `${repositoryUrl}/actions/runs/${runId}`

/**
 * Pads the specified number with leading zeros and returns it as a string.
 */
export const addLeadingZeros = (input: number, length = 2): string => String(input).padStart(length, '0')

/**
 * Pads the specified number with leading zeros and returns it as a string.
 */
export const padTime = (time: string): string =>
  time
    .split(':')
    .map(n => addLeadingZeros(parseInt(n)))
    .join(':')

/**
 * Formats a date to a string.
 */
export const formatDate = (date: Date = new Date(), time = true): string => {
  date.setHours(date.getHours() + 2)
  const [dateString, timeString] = date.toISOString().split('T')
  if (!time) return dateString
  return `${dateString} ${padTime(timeString.split('.').at(0) as string)}`
}
