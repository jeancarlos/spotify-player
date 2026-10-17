import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { sources } from './sourceFiles'

const FAINT = /(?<![\w-])text-(black|white)\/([1-5]\d|[1-9])\b/g
const DECORATION = [
  { file: 'shared/EmptyState.tsx', needle: '{icon}' },
  { file: 'shared/TiltCover.tsx', needle: 'text-5xl' },
  { file: 'shared/MediaCard.tsx', needle: 'text-4xl' },
]

describe('text contrast', () => {
  it('keeps readable text at text-black/60 or stronger', () => {
    const root = join(__dirname, '..')
    const offenders = sources(root).flatMap((file) => {
      const rel = relative(join(root, 'components'), file)
      const lines = readFileSync(file, 'utf8').split('\n')
      return lines.flatMap((line, i) => {
        if (!line.match(FAINT)) return []
        if (DECORATION.some((d) => d.file === rel && line.includes(d.needle))) return []
        return [`${relative(root, file)}:${String(i + 1)}`]
      })
    })
    expect(offenders).toEqual([])
  })
})
