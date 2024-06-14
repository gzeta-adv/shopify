import 'dotenv/config'
import { client } from './client'
import { collections } from './collections'
import { inventory } from './inventory'
import { locations } from './locations'
import { orders } from './orders'
import { productVariants } from './product-variants'

export { client, collections, inventory, locations, orders, productVariants }
export default { ...client, ...collections, ...inventory, ...locations, ...orders, ...productVariants }

export * from './data'
export * from './utils'
export * from './types'
