import actions from '@/actions'
import { actionsMessage, argsMessage, exit, includesArray, toCamelCase } from '@/utils'

const [workflow, ...args] = process.argv.slice(2)
if (!workflow) exit(`No action provided.\n${actionsMessage(actions)}`)

const action = toCamelCase(workflow) as keyof typeof actions
const fn = actions[action]
if (!fn) exit(`Action ${workflow} not found\n${actionsMessage(actions)}.`)

if (args.length && fn?.args?.length && !includesArray(fn.args, args)) {
  exit(argsMessage(args, fn.args))
}

;(async (): Promise<void> => {
  await fn(...args)
})()
