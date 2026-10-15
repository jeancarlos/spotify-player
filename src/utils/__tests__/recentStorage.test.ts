import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readRecent, pushRecent } from '../recentStorage'
import type { Track } from '@/types/music'

const track: Track = {
  uri: 'deezer:track:1',
  id: '1',
  name: 'Track 1',
  type: 'track',
  explicit: false,
  is_playable: true,
  preview_url: 'http://preview.mp3',
  duration_ms: 180000,
  artists: [{ uri: 'deezer:artist:1', id: '1', name: 'A', type: 'artist' }],
  album: { uri: 'deezer:album:1', id: '1', name: 'Album', type: 'album', images: [] },
} as unknown as Track

describe('recentStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads empty when storage is empty', () => {
    expect(readRecent()).toEqual([])
  })

  it('pushRecent adds track without preview_url and dispatches the event', () => {
    const eventSpy = vi.spyOn(window, 'dispatchEvent')
    pushRecent(track)
    const stored = readRecent()
    expect(stored).toHaveLength(1)
    expect(stored[0].preview_url).toBeNull()
    expect(stored[0].is_playable).toBe(true)
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'spoter:recent-changed' })
    )
  })

  it('dedupes by uri, keeps newest first', () => {
    pushRecent(track)
    pushRecent({ ...track, uri: 'deezer:track:2', id: '2' })
    pushRecent({ ...track, name: 'Updated' })
    const stored = readRecent()
    expect(stored.map((t) => t.id)).toEqual(['1', '2'])
    expect(stored[0].name).toBe('Updated')
  })

  it('limits to 10 tracks', () => {
    for (let i = 0; i < 15; i++) pushRecent({ ...track, uri: `deezer:track:${i}`, id: String(i) })
    const stored = readRecent()
    expect(stored).toHaveLength(10)
    expect(stored[0].id).toBe('14')
  })

  it('handles malformed JSON gracefully', () => {
    localStorage.setItem('spoter_recent_v1', 'not json')
    expect(readRecent()).toEqual([])
  })

  it('drops stored entries that are not whole tracks', () => {
    localStorage.setItem(
      'spoter_recent_v1',
      JSON.stringify([
        track,
        null,
        5,
        { uri: 'x', name: 'no album', artists: [] },
        { ...track, artists: 'A' },
      ])
    )
    expect(readRecent().map((t) => t.uri)).toEqual([track.uri])
  })

  it('handles storage errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => {
      pushRecent(track)
    }).not.toThrow()
  })
})

describe('recentStorage legacy images', () => {
  it('returns old smallest-first covers largest first', () => {
    vi.restoreAllMocks()
    localStorage.clear()
    const old = {
      ...track,
      album: {
        ...track.album,
        images: [
          { url: 'small', width: null, height: null },
          { url: 'xl', width: null, height: null },
        ],
      },
    }
    localStorage.setItem('spoter_recent_v1', JSON.stringify([old]))
    expect(readRecent()[0].album.images.map((i) => i.url)).toEqual(['xl', 'small'])
  })
})
