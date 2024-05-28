export interface Collection extends Record<string, any> {
  id: string
  title: string
}

export interface CollectionsRequestOptions {
  cursor?: string
  fields?: string
}

export interface CollectionsResponse<T extends Collection = Collection> {
  collections: {
    nodes: T[]
    pageInfo?: {
      startCursor: string
      endCursor: string
      hasPreviousPage: boolean
      hasNextPage: boolean
    }
  }
}

export interface UnpublishCollectionOptions {
  id: string
  publications: string[]
  fields?: string
}

export interface UnpublishCollectionResponse<T extends Collection = Collection> {
  collectionUnpublish: {
    collection?: T
    userErrors?: {
      field: string
      message: string
    }[]
  }
}
