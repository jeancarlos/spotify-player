import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/locales/en-US.json'
import pt from '@/locales/pt-BR.json'

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path)
    return /\.tsx?$/.test(name) && !name.includes('.test.') ? [path] : []
  })
}

function has(locale: unknown, key: string): boolean {
  const node = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      locale
    )
  if (node !== undefined) return true
  const parent = key
    .split('.')
    .slice(0, -1)
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      locale
    )
  return !!parent && typeof parent === 'object' && `${key.split('.').pop()}_other` in parent
}

describe('i18n keys', () => {
  const used = new Set<string>()
  for (const file of sources(join(process.cwd(), 'src'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([\w.]+)'/g)) used.add(m[1])
  }

  it('finds the keys it is meant to check', () => {
    expect(used.size).toBeGreaterThan(20)
  })

  it.each([
    ['en-US', en],
    ['pt-BR', pt],
  ])('every literal t() key exists in %s', (_name, locale) => {
    expect([...used].filter((k) => !has(locale, k))).toEqual([])
  })

  it('keeps both locales on the same keys', () => {
    const flat = (o: unknown, p = ''): string[] =>
      Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
        typeof v === 'object' && v ? flat(v, `${p}${k}.`) : [`${p}${k}`]
      )
    expect(flat(en).sort()).toEqual(flat(pt).sort())
  })
})
