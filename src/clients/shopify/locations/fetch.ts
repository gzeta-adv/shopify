import { RESOURCES_LIMIT, client } from '@/clients/shopify'

import type { Location } from '@/clients/shopify'

const LOCATION_FIELDS = 'id, isActive, shipsInventory'

/**
 * Request options for fetching locations using the Shopify Admin API.
 */
export interface FetchLocationsRequestOptions {
  fields?: string
  limit?: number
}

const fetchLocationsOperation = (fields?: string) => {
  const locationFields = [LOCATION_FIELDS, fields].filter(Boolean).join('\n')

  return `
    query ($limit: Int!) {
      locations(first: $limit) {
        nodes {
          ${locationFields}
        }
      }
    }
  `
}

/**
 * Fetch store locations using the Shopify API.
 */
export const fetchLocations = async <T extends Location = Location>({
  fields,
  limit = RESOURCES_LIMIT,
}: FetchLocationsRequestOptions = {}): Promise<T[]> => {
  const { data, errors } = await client.request(fetchLocationsOperation(fields), {
    variables: { limit },
  })
  if (errors) throw new Error(errors.message)
  return data?.locations?.nodes || []
}

/**
 * Fetch store locations using the Shopify API.
 */
export const fetchPrimaryLocation = async <T extends Location = Location>({
  fields,
}: FetchLocationsRequestOptions = {}): Promise<T> =>
  (await fetchLocations({ fields })).find(({ isActive, shipsInventory }) => isActive && shipsInventory) as T
