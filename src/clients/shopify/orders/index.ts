import { fetchAllOrders, fetchOrders } from './fetch'

export { fetchAllOrders, fetchOrders }
export const orders = { fetchAllOrders, fetchOrders }

export type { FetchOrdersRequestOptions, FetchOrdersResponse } from './fetch'
