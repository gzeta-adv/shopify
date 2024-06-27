import { UserConfig } from '@commitlint/types'

export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [commit => /build\(deps(-dev)?\)/.test(commit)],
  defaultIgnores: true,
} as UserConfig
