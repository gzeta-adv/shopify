import 'dotenv/config'
import { client } from './client'
import { records } from './records'

export { client, records }
export default { ...client, ...records }

export * from './data'
export type * from './types'
export * from './utils'
