import 'dotenv/config'
import { client } from './client'
import { records } from './records'

export { client, records }
export default { ...client, ...records }

export type * from './types'
