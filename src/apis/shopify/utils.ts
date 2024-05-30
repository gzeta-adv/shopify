/**
 * Log the user errors from a Shopify API response.
 */
export const parseUserErrors = (userErrors?: { field: string; message: string }[]) =>
  userErrors ? userErrors.map(({ field, message }) => `${field}: ${message}`).join('\n') : undefined
