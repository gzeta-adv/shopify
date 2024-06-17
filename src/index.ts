import actions from '@/actions'
import { actionsMessage, exit, parseActionArgs, times, toCamelCase } from '@/utils'

const [workflow, ...args] = process.argv.slice(2)
if (!workflow) exit(`Error: no action provided\n${actionsMessage(actions)}`)

const action = toCamelCase(workflow) as keyof typeof actions
const fn = actions[action]
if (!fn) exit(`Error: action ${workflow} not found\n${actionsMessage(actions)}`)

const opts = parseActionArgs(args)

;(async (): Promise<void> => {
  await times(opts.retries, async () => {
    await fn(opts)
  })
})()
