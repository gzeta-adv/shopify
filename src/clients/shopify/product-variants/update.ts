import { client } from '@/clients/shopify'

import type { Product, ProductVariant } from '@/clients/shopify'

const PRODUCT_VARIANT_FIELDS = 'id'

/**
 * Request options for updating product variants using the Shopify Admin API.
 */
export interface UpdateProductVariantsRequestOptions {
  productId: Product['id']
  variants: ProductVariant[]
  fields?: string
}

/**
 * Response after updating product variants using the Shopify Admin API.
 */
export interface UpdateProductVariantsResponse<T extends Product = Product, K extends ProductVariant = ProductVariant> {
  productVariantsBulkUpdate: {
    product?: T
    productVariants?: K[]
    userErrors?: {
      field: string
      message: string
    }[]
  }
}

/**
 * Returns the GraphQL operation to fetch product variants and page info from the Shopify API.
 */
const updateProductVariantsOperation = (fields?: string) => {
  const variantFields = [PRODUCT_VARIANT_FIELDS, fields].filter(Boolean).join('\n')

  return `
    mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
        product {
          id
        }
        productVariants {
          ${variantFields}
        }
        userErrors {
          field
          message
        }
      }
    }
  `
}

export const updateProductVariants = async <T extends Product = Product, K extends ProductVariant = ProductVariant>({
  productId,
  variants,
  fields,
}: UpdateProductVariantsRequestOptions): Promise<UpdateProductVariantsResponse<T, K>> => {
  const { data, errors } = await client.request<UpdateProductVariantsResponse<T, K>>(
    updateProductVariantsOperation(fields),
    {
      variables: {
        productId,
        variants,
      },
    }
  )

  const error = errors?.graphQLErrors ? errors.graphQLErrors[0].message : errors?.message
  if (error) throw new Error(error)
  if (!data) throw new Error('Shopify API error')

  return data
}
