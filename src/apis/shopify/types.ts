import { ClientResponse as ShopifyClientResponse } from '@shopify/admin-api-client'

export interface ClientResponse<T extends Record<string, any>> extends Omit<ShopifyClientResponse<T>, 'errors'> {
  errors?: ShopifyClientResponse['errors'] | ShopifyClientResponse['errors'][]
}

export type {
  Collection,
  FetchCollectionsRequestOptions,
  FetchCollectionsResponse,
  PublishCollectionOptions,
  PublishCollectionResponse,
} from './collections'
