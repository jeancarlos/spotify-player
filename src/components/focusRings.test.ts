import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path)
    return name.endsWith('.tsx') ? [path] : []
  })
}

describe('focus rings', () => {
  it('every file that removes the outline also draws a focus ring', () => {
    const offenders = sources(join(__dirname, '..')).filter((file) => {
      const text = readFileSync(file, 'utf8')
      return text.includes('outline-none') && !/(focus-visible|focus|focus-within):ring-/.test(text)
    })
    expect(offenders).toEqual([])
  })
})
