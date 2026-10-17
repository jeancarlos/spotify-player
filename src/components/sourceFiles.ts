import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path)
    return name.endsWith('.tsx') ? [path] : []
  })
}
