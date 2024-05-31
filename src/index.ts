import actions from '@/actions'
import { exit, includesArray, toCamelCase, toKebabCase } from '@/utils'

const actionsMessage = `Available actions: ${Object.keys(actions).map(toKebabCase).join(', ')}`
const argsMessage = (args: string[], fnArgs: string[]) =>
  `Wrong arguments: ${args.filter(arg => !includesArray(fnArgs, [arg]))}\nAvailable arguments: ${fnArgs.join(', ')}\n`

const [workflow, ...args] = process.argv.slice(2)
if (!workflow) exit(`No workflow provided\n${actionsMessage}\n`)

const action = toCamelCase(workflow) as keyof typeof actions
const fn = actions[action]
if (!fn) exit(`Action ${action} not found\n${actionsMessage}\n`)

if (args.length && fn?.args?.length && !includesArray(fn.args, args)) exit(argsMessage(args, fn.args))

const exec = async (): Promise<void> => {
  await fn(...args)
}

exec()
