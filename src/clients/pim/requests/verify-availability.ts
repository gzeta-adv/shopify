import client, { PIM_RESOURCES_LIMIT } from '@/clients/pim'
import { RequestMethod } from '@/types'
import { chunks } from '@/utils'

interface Item {
  variantId: string
  requestedAvailability?: number
}

export type VerifyAvailabilityRequest = {
  items: Item[]
  limit?: number
}

export type VerifyAvailabilityResponse = {
  variantId: string
  actualAvailability: number
  available: boolean
  description?: string
}[]

const fetchAvailability = async (items: Item[]) =>
  await client.fetch<VerifyAvailabilityResponse>(client.endpoints.verify, RequestMethod.POST, {
    items,
  })

/**
 * Verify the availability of items using the PIM API.
 */
export const verifyAvailability = async ({ items, limit = PIM_RESOURCES_LIMIT }: VerifyAvailabilityRequest) => {
  const availabilities: VerifyAvailabilityResponse = []

  for (const chunk of chunks(items, limit)) {
    try {
      const res = await fetchAvailability(chunk)
      if (res.message) throw new Error(res.message)

      availabilities.push(...res)
    } catch (e) {
      if (chunk.length === 1) continue

      const itemAvailabilities = await verifyAvailability({ items: chunk, limit: Math.floor(limit / 2) })
      availabilities.push(...itemAvailabilities)
    }
  }

  return availabilities
}
