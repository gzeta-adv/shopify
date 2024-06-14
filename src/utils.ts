export { default as pluralize } from 'pluralize'

/**
 * Gets an environment variable or logs an error and exit the process if missing.
 */
export const env = (key: string, fallback: any = key): string => {
  const value = process.env[key]
  if (value) return value
  return fallback
}

/**
 * Logs an error message and exit the process.
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
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'

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
export const titleize = (string: string, capitalize = true): string => {
  const title = string
    .replace(/_|-|:/g, ' ')
    .replace(/[A-Z]/g, m => ` ${m}`)
    .trim()

  if (!capitalize) return title
  return title.replace(/\b\w/g, c => c.toUpperCase())
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
 * Converts a string to colon:case.
 */
export const toColonCase = (s: string): string =>
  s
    .replace(/[A-Z]/g, m => `:${m}`)
    .toLowerCase()
    .replace(/[_-]/g, () => ':')

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
 * Transforms the keys of an array of objects to a given case.
 */
export const transformKeys = <T extends Record<string, any>>(
  array: T[],
  mode: 'camel' | 'colon' | 'kebab' | 'snake' | 'title' = 'camel'
): T[] =>
  array.map(object =>
    Object.keys(object).reduce((transformed, key) => {
      const fnName = `to${toCamelCase(mode)}Case`

      if (!Object.hasOwn(global, fnName)) {
        exit(`Error: ${fnName} is not a valid function`)
      }

      const fn: (s: string) => string = global[fnName as keyof typeof global]

      return {
        ...transformed,
        [fn(key)]: object[key],
      }
    }, {} as T)
  )

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
 * Checks if an array includes all the specified values.
 */
export const includesArray = <T>(array: T[], values: T[]): boolean => values.every(value => array.includes(value))

/**
 * Prints a message with the available actions.
 */
export const actionsMessage = (actions: Record<string, any>) =>
  `Available actions: ${Object.keys(actions).map(toKebabCase).sort().join(', ')}`

/**
 * Prints a message with the available action arguments.
 */
export const argsMessage = (args: string[], fnArgs: string[]) =>
  `Wrong arguments: ${args.filter(arg => !includesArray(fnArgs, [arg]))}\nAvailable arguments: ${fnArgs.join(', ')}\n`

/**
 * Sleeps for a given number of milliseconds.
 */
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Turns the number to 0 if negative.
 */
export const toPositive = (n: number): number => (n < 0 ? 0 : n)

/**
 * Builds a URLSearchParams object from an object.
 */
export const buildURLSearchParams = <T extends Record<any, any>>(params: T): URLSearchParams =>
  new URLSearchParams(params)
