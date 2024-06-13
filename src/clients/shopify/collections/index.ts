import { fetchCollections, fetchAllCollections } from './fetch'
import { publishCollection, unpublishCollection } from './publish'

export { fetchCollections, fetchAllCollections, publishCollection, unpublishCollection }
export const collections = {
  fetchCollections,
  fetchAllCollections,
  publishCollection,
  unpublishCollection,
}

export type { FetchCollectionsRequestOptions, FetchCollectionsResponse } from './fetch'
export type { PublishCollectionOptions, PublishCollectionResponse } from './publish'
