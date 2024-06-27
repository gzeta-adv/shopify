import 'dotenv/config'
import { client } from './client'
import { collections } from './collections'
import { inventory } from './inventory'
import { locations } from './locations'
import { orders } from './orders'
import { productVariants } from './product-variants'
import { shop } from './shop'

export { client, collections, inventory, locations, orders, productVariants, shop }
export default { ...client, ...collections, ...inventory, ...locations, ...orders, ...productVariants, ...shop }

export * from './data'
export * from './utils'
export * from './types'
