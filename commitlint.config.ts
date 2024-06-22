import { UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  ignores: [commit => /build\(deps(-dev)?\)/.test(commit)],
  defaultIgnores: true,
}

export default config
