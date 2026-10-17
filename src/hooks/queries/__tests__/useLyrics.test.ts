import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchLyrics, lyricsKey } from '../useLyrics'

const params = { artist: 'A', title: 'T', album: 'Al', durationMs: 1000 }

afterEach(() => vi.unstubAllGlobals())

describe('lyricsKey', () => {
  it('includes the cleaned title and the album', () => {
    expect(lyricsKey({ ...params, title: 'T - Remastered 2011' })).toEqual(['lyrics', 'A', 'T', 1000, 'Al'])
  })

  it('differs per album', () => {
    expect(lyricsKey(params)).not.toEqual(lyricsKey({ ...params, album: 'Other' }))
  })
})

const okJson = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) })

describe('fetchLyrics', () => {
  it('returns an empty list when lrclib has no match', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(fetchLyrics(params)).resolves.toEqual([])
  })

  it.each([429, 500, 503])('throws on transient status %i', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))
    await expect(fetchLyrics(params)).rejects.toThrow(String(status))
  })

  it.each([
    ['omits the album parameter when the track has none', { album: '' }, 'album_name='],
    ['omits the duration parameter when the track has none', { durationMs: 0 }, 'duration='],
  ])('%s', async (_name, override, param) => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', f)
    await fetchLyrics({ ...params, ...override })
    expect(String(f.mock.calls[0][0])).not.toContain(param)
  })

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(fetchLyrics(params)).rejects.toThrow('offline')
  })

  it('returns an empty list when neither synced nor plain lyrics exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({})))
    await expect(fetchLyrics(params)).resolves.toEqual([])
  })

  it('parses synced lyrics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(okJson({ syncedLyrics: '[00:01.00]hi' }))
    )
    await expect(fetchLyrics(params)).resolves.toEqual(['hi'])
  })

  it('falls back to plain lyrics when the synced ones parse to nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(okJson({ syncedLyrics: 'no stamps here', plainLyrics: 'one\ntwo' }))
    )
    await expect(fetchLyrics(params)).resolves.toEqual(['one', 'two'])
  })

  it('returns plain lyrics without a track duration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(okJson({ plainLyrics: 'one\ntwo' }))
    )
    await expect(fetchLyrics({ ...params, durationMs: undefined })).resolves.toEqual(['one', 'two'])
  })
})
