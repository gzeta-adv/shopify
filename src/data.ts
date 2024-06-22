import { repository } from '~/package.json'

export const RETRIES = parseInt(process.env.RETRIES || '') || 1
export const MAX_RETRIES = 10

export const repositoryUrl = repository.url.replace('.git', '')
