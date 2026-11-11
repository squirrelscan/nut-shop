/**
 * bun run fault on <id> | off <id> | list | reset
 * Edits faults/active.json and appends to faults/LOG.md.
 */
import { appendFileSync } from 'node:fs'
import { FAULTS } from '../faults/registry'

const activePath = new URL('../faults/active.json', import.meta.url).pathname
const logPath = new URL('../faults/LOG.md', import.meta.url).pathname
const ids = new Set<string>(FAULTS.map((f) => f.id))
const [cmd, id] = process.argv.slice(2)

const read = async (): Promise<string[]> => (await Bun.file(activePath).json()) as string[]
const write = (list: string[]) => Bun.write(activePath, JSON.stringify(list, null, 2) + '\n')
const log = (action: string, fid: string) => appendFileSync(logPath, `- ${new Date().toISOString()} ${action} ${fid}\n`)

const usage = () => {
  console.error('usage: bun run fault <on|off> <id> | list | reset')
  process.exit(2)
}

const current = await read()
switch (cmd) {
  case 'on':
  case 'off': {
    if (!id || !ids.has(id)) {
      console.error(`unknown fault id: ${id ?? '(none)'}. Run: bun run fault list`)
      process.exit(1)
    }
    const next = cmd === 'on' ? [...new Set([...current, id])] : current.filter((x) => x !== id)
    if (next.length === current.length && cmd === 'on' && current.includes(id)) {
      console.log(`${id} already on`)
      break
    }
    if (cmd === 'off' && !current.includes(id)) {
      console.log(`${id} already off`)
      break
    }
    await write(next)
    log(cmd, id)
    console.log(`${cmd} ${id}. active: [${next.join(', ')}]`)
    break
  }
  case 'list':
    for (const f of FAULTS) console.log(`${current.includes(f.id) ? '[ON ] ' : '[off] '}${f.id.padEnd(36)} ${f.severity.padEnd(6)} ${f.expectedRule}  ${f.title}`)
    break
  case 'reset': {
    for (const x of current) log('off', x)
    log('reset', `(${current.length} cleared)`)
    await write([])
    console.log('reset: healthy baseline')
    break
  }
  default:
    usage()
}
