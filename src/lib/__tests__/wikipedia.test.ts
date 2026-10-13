import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWikiSummary, findWikiSummary, searchWikiTitle } from '../wikipedia'

const json = (body: unknown, ok = true) => ({ ok, json: () => Promise.resolve(body) }) as Response

afterEach(() => vi.unstubAllGlobals())

describe('fetchWikiSummary', () => {
  it('truncates long extracts and returns the page url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json({ extract: 'a'.repeat(20), content_urls: { desktop: { page: 'https://x/p' } } })
      )
    )
    const r = await fetchWikiSummary('en', 'T', 10)
    expect(r).toEqual({ extract: 'a'.repeat(10) + '...', lang: 'en', url: 'https://x/p' })
  })

  it('builds a fallback url and returns null on non-ok or empty extract', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(json({ extract: 'hi' }))
      .mockResolvedValueOnce(json({}, false))
      .mockResolvedValueOnce(json({}))
    vi.stubGlobal('fetch', f)
    expect((await fetchWikiSummary('pt', 'A B', 10))?.url).toBe(
      'https://pt.wikipedia.org/wiki/A%20B'
    )
    expect(await fetchWikiSummary('pt', 'A', 10)).toBeNull()
    expect(await fetchWikiSummary('pt', 'A', 10)).toBeNull()
  })
})

describe('searchWikiTitle', () => {
  it('returns the first title containing the match, case-insensitive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(['q', ['Other', 'Foo Bar']])))
    expect(await searchWikiTitle('en', 'q', 'foo')).toBe('Foo Bar')
  })

  it('returns null on non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([], false)))
    expect(await searchWikiTitle('en', 'q', 'foo')).toBeNull()
  })
})

describe('findWikiSummary', () => {
  const opts = { query: 'Foo', match: 'Foo', truncate: 50, preferPt: true }
  const route = (map: Record<string, Response>) =>
    vi.fn((url: string) => {
      const key = Object.keys(map).find((k) => url.startsWith(k))
      if (!key) throw new Error('unexpected ' + url)
      return Promise.resolve(map[key])
    })

  it('uses pt when it resolves', async () => {
    vi.stubGlobal(
      'fetch',
      route({
        'https://pt.wikipedia.org/w/api.php': json(['Foo', ['Foo']]),
        'https://pt.wikipedia.org/api/rest_v1': json({ extract: 'ola' }),
      })
    )
    expect((await findWikiSummary(opts))?.lang).toBe('pt')
  })

  it('falls back to en when pt finds nothing', async () => {
    vi.stubGlobal(
      'fetch',
      route({
        'https://pt.wikipedia.org/w/api.php': json(['Foo', []]),
        'https://en.wikipedia.org/w/api.php': json(['Foo', ['Foo']]),
        'https://en.wikipedia.org/api/rest_v1': json({ extract: 'hello' }),
      })
    )
    expect((await findWikiSummary(opts))?.lang).toBe('en')
  })

  it('skips pt when preferPt is false', async () => {
    const f = route({
      'https://en.wikipedia.org/w/api.php': json(['Foo', []]),
    })
    vi.stubGlobal('fetch', f)
    expect(await findWikiSummary({ ...opts, preferPt: false })).toBeNull()
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('propagates errors unless safe, then falls back', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    await expect(findWikiSummary(opts)).rejects.toThrow('net')
    expect(await findWikiSummary({ ...opts, safe: true })).toBeNull()
  })
})
