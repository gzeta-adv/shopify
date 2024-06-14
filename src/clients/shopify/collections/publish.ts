import { client } from '@/clients/shopify'
import { titleize } from '@/utils'

import type { Collection } from '@/clients/shopify'

const getPublishOperation = (action: 'publish' | 'unpublish' = 'publish', fields?: string) => {
  const nodes = ['id', 'title', fields].filter(String).join('\n')
  const actionName = titleize(action)

  return `
    mutation collection${actionName}($input: Collection${actionName}Input!) {
      collection${actionName}(input: $input) {
        collection {
          ${nodes}
        }
        userErrors {
          field
          message
        }
      }
    }
  `
}

/**
 * Request options for publishing or unpublishing a collection using the Shopify Admin API.
 */
export interface PublishCollectionOptions {
  id: string
  publications: string[]
  fields?: string
}

/**
 * Response after publishing or unpublishing a collection using the Shopify Admin API.
 */
export interface PublishCollectionResponse<T extends Collection = Collection> {
  collectionUnpublish: {
    collection?: T
    userErrors?: {
      field: string
      message: string
    }[]
  }
}

const editCollectionPublications = async <T extends Collection = Collection>({
  id,
  publications,
  fields,
  action = 'publish',
}: PublishCollectionOptions & { action: 'publish' | 'unpublish' }): Promise<
  PublishCollectionResponse<T>['collectionUnpublish']
> => {
  const operation = getPublishOperation(action, fields)
  const collectionPublications = publications.map(publicationId => ({ publicationId }))

  const { data, errors } = await client.request<PublishCollectionResponse<T>>(operation, {
    variables: {
      input: { id, collectionPublications },
    },
  })

  if (errors) throw new Error(`${errors.message} (${errors.networkStatusCode})`)

  return data?.collectionUnpublish || {}
}

/**
 * Publishes a collection to the specified publications.
 */
export const publishCollection = async <T extends Collection = Collection>({
  id,
  publications,
  fields,
}: PublishCollectionOptions): Promise<PublishCollectionResponse<T>['collectionUnpublish']> =>
  editCollectionPublications({ id, publications, fields, action: 'publish' })

/**
 * Unpublishes a collection from the specified publications.
 */
export const unpublishCollection = async <T extends Collection = Collection>({
  id,
  publications,
  fields,
}: PublishCollectionOptions): Promise<PublishCollectionResponse<T>['collectionUnpublish']> =>
  editCollectionPublications({ id, publications, fields, action: 'unpublish' })
