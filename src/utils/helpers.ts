/**
 * Get an environment variable or log an error and exit if it's missing.
 */
export const env = (key: string): string => {
  const value = process.env[key]
  if (value) return value

  console.error(`Error: missing environment variable ${key}`)
  process.exit(1)
}

/**
 * Log an error message and exit the process.
 */
export const exit = (message?: string, code: number = 1): void => {
  if (message) logger.error(`❌ ${message}\n`)
  process.exit(code)
}

/**
 * Check if the current environment is GitHub Actions.
 */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'

/**
 * Logger with support for GitHub Actions annotations.
 */
export const logger = {
  error: (...data: any[]): void => (isGithubActions ? console.error('::error::', ...data) : console.error(...data)),
  info: (...data: any[]): void => console.info(...data),
  notice: (...data: any[]): void => (isGithubActions ? console.info('::notice::', ...data) : console.info(...data)),
  warning: (...data: any[]): void => (isGithubActions ? console.warn('::warning::', ...data) : console.warn(...data)),
}

/**
 * Pluck a key from an array of objects.
 */
export const pluck = <A extends Record<string, any>, K extends string>(array: A[], key: K): A[K][] =>
  array.map(el => el[key])

/**
 * Generate an array of numbers in a given range.
 */
export const range = (start: number, stop: number, step = 1): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

/**
 * Convert an array of items into a human-readable sentence.
 */
export const sentencize = (array: any[]): string => new Intl.ListFormat().format(array)

/**
 * Perform an action n times and return the results.
 */
export const times = async <T>(n: number, callback: (i: number) => T): Promise<T[]> =>
  Promise.all(range(1, n).map(i => callback(i)))

/**
 * Convert a string to camelCase.
 */
export const toCamelCase = (s: string): string => s.toLowerCase().replace(/([-_:]+\w)/g, m => m.slice(-1).toUpperCase())

/**
 * Convert a string to kebab-case.
 */
export const toKebabCase = (s: string): string =>
  s
    .replace(/[A-Z]/g, m => `-${m}`)
    .toLowerCase()
    .replace(/_/g, () => '-')

/**
 * Convert a string to colon:case.
 */
export const toColonCase = (s: string): string =>
  s
    .replace(/[A-Z]/g, m => `:${m}`)
    .toLowerCase()
    .replace(/[_-]/g, () => ':')

/**
 * Convert a string to snake_case.
 */
export const toSnakeCase = (s: string): string =>
  s
    .replace(/[A-Z]/g, m => `_${m}`)
    .toLowerCase()
    .replace(/-/g, () => '_')

/**
 * Transform the keys of an array of objects to a given case.
 */
export const transformKeys = <T extends Record<string, any>>(
  array: T[],
  mode: 'camel' | 'colon' | 'kebab' | 'snake' = 'camel'
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
 * Resolve nodes from a GraphQL response.
 */
export const resolveNodes = <T extends Record<string, any>>(nodes: T[]): T[] =>
  nodes?.map(node => {
    for (const key of Object.keys(node)) {
      const nodeValue: any = node[key as keyof typeof node]

      if (Object.hasOwn(nodeValue, 'edges')) {
        // @ts-expect-error - key is a valid key of node
        node[key] = nodeValue.edges.map(({ node }) => node)[0]
      }
    }
    return node
  })
