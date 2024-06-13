import { fetchAllProductVariants, fetchProductVariants } from './fetch'
import { updateProductVariants } from './update'

export { fetchAllProductVariants, fetchProductVariants, updateProductVariants }
export const productVariants = { fetchAllProductVariants, fetchProductVariants, updateProductVariants }

export type { FetchProductVariantsRequestOptions, FetchProductVariantsResponse } from './fetch'
export type { UpdateProductVariantsRequestOptions, UpdateProductVariantsResponse } from './update'
