import actions from '@/actions'
import { exit, toCamelCase, toKebabCase } from '@/utils'

const names = Object.keys(actions).map(toKebabCase)
const message = `Available actions: ${names.join(', ')}`

const [cmd, arg, ...opts] = process.argv.slice(2)
if (!cmd) exit(`No action provided\n${message}`)
if (opts.length) exit(`Unrecognized options: ${opts.join(' ')}`)

const userAction = toCamelCase(cmd) as keyof typeof actions
const action = actions[userAction] as (...args: string[]) => Promise<void>
if (!action) exit(`Action ${cmd} not found\n${message}`)

const exec = async (): Promise<void> => {
  await action(arg)
}

exec()
