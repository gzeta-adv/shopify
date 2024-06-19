import client from '@/clients/pim'
import { RequestMethod } from '@/types'

export default async <T extends Record<string, any> | Record<string, any>[]>(
  endpoint: string,
  method: RequestMethod = RequestMethod.GET,
  body: Record<string, any> = {}
): Promise<T & { message: string }> => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const response = await fetch(`${client.apiUrl}${path}`, {
    method,
    headers: {
      Authorization: client.apiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return await response.json()
}
