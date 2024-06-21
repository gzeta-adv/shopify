import { repository } from '../package.json'

export const MAX_ACTION_RETRIES = 10

export const repositoryUrl = repository.url.replace('.git', '')
