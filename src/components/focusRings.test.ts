import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { sources } from './sourceFiles'

const RING = /(focus-visible|focus-within|focus):ring-|focusRing\(/
const ALLOWED = [{ file: 'shared/SearchBar.tsx', needle: 'bg-transparent text-sm outline-none' }]

function expressionAround(text: string, at: number): string {
  const start = Math.max(
    text.lastIndexOf('cn(', at),
    text.lastIndexOf('className=', at),
    text.lastIndexOf('\n\n', at)
  )
  const ends = [text.indexOf('\n\n', at), text.indexOf('/>', at), text.indexOf('>\n', at)].filter(
    (n) => n > at
  )
  return text.slice(start, Math.min(...ends, text.length))
}

describe('focus rings', () => {
  it('every outline-none sits in a class expression that also draws a focus ring', () => {
    const offenders = sources(join(__dirname)).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      const rel = relative(__dirname, file)
      const hits: string[] = []
      for (
        let at = text.indexOf('outline-none');
        at !== -1;
        at = text.indexOf('outline-none', at + 1)
      ) {
        const expr = expressionAround(text, at)
        const allowed = ALLOWED.some((a) => a.file === rel && expr.includes(a.needle))
        if (!RING.test(expr) && !allowed)
          hits.push(`${rel}:${text.slice(0, at).split('\n').length}`)
      }
      return hits
    })
    expect(offenders).toEqual([])
  })
})
