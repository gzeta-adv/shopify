import { fetchCollections, fetchAllCollections, unpublishCollection } from './requests'

export { fetchCollections, fetchAllCollections, unpublishCollection }
export const collections = { fetchCollections, fetchAllCollections, unpublishCollection }

export type {
  Collection,
  CollectionsRequestOptions,
  CollectionsResponse,
  UnpublishCollectionOptions,
  UnpublishCollectionResponse,
} from './types'
