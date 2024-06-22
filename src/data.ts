import { repository } from '~/package.json'
import { env } from '@/utils'

export const RETRIES = env('RETRIES', 1)
export const MAX_ACTION_RETRIES = 10

export const repositoryUrl = repository.url.replace('.git', '')
