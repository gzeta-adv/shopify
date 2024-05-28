import 'dotenv/config'

import { client } from './client'
import { collections } from './collections'

export { client, collections }
export type { Collection } from './collections'

export default { ...client, ...collections }
