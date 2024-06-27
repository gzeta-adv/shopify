import { repository } from '~/package.json'

export const RETRIES = parseInt(process.env.RETRIES || '1')
export const REPOSITORY_URL = repository.url.replace('.git', '')

export const MAX_RETRIES = 10
