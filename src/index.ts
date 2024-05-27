import scripts from '@/scripts'
import { exit, toCamelCase, toKebabCase } from '@/utils/helpers'

const names = Object.keys(scripts).map(toKebabCase)
const message = `Available scripts: ${names.join(', ')}`

const [cmd, arg, ...opts] = process.argv.slice(2)
if (!cmd) exit(`No script provided\n${message}`)
if (opts.length) exit(`Unrecognized options: ${opts.join(' ')}`)

const userScript = toCamelCase(cmd) as keyof typeof scripts
const script = scripts[userScript] as (...args: string[]) => Promise<void>
if (!script) exit(`Action ${cmd} not found\n${message}`)

const exec = async (): Promise<void> => {
  await script(arg)
}

exec()
