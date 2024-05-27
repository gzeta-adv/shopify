import 'dotenv/config'

import { client } from './client'
import { collections } from './collections'

export { client, collections }
export default { ...client, ...collections }
