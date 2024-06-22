import { THROTTLED_MESSAGE } from './data'
import { ResponseError } from './types'

/**
 * Check if a response error is due to a throttling issue.
 */
export const isThrottled = (error: ResponseError): boolean =>
  error.graphQLErrors?.some(({ message }) => message === THROTTLED_MESSAGE) || false

/**
 * Log the user errors from a Shopify API response.
 */
export const parseUserErrors = (userErrors?: { field: string; message: string }[]) =>
  userErrors ? userErrors.map(({ field, message }) => `${field}: ${message}`).join('\n') : undefined
