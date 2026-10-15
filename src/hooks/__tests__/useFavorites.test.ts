import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../useFavorites'
import type { Track } from '@/types/music'

const KEY = 'spoter_favorites_v2'

const mk = (id: string): Track =>
  ({
    uri: `deezer:track:${id}`,
    id,
    name: `Track ${id}`,
    type: 'track',
    explicit: false,
    is_playable: true,
    preview_url: 'http://preview.mp3',
    duration_ms: 180000,
    artists: [{ uri: 'deezer:artist:1', id: '1', name: 'A', type: 'artist' }],
    album: { uri: 'deezer:album:1', id: '1', name: 'Album', type: 'album', images: [] },
  }) as unknown as Track

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? '{}')

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts empty with the default playlist name', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.tracks).toEqual([])
    expect(result.current.notes).toEqual({})
    expect(result.current.playlistName).toBe('Vinyla List')
  })

  it('reads old smallest-first covers largest first', () => {
    const old = mk('1')
    old.album.images = [
      { url: 'small', width: null, height: null },
      { url: 'xl', width: null, height: null },
    ]
    localStorage.setItem(KEY, JSON.stringify({ tracks: [old], notes: {} }))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.tracks[0].album.images.map((i) => i.url)).toEqual(['xl', 'small'])
  })

  it('keeps both tracks when two adds happen before a re-render', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
      result.current.addTrack(mk('2'))
    })
    expect(result.current.tracks.map((t) => t.id)).toEqual(['2', '1'])
    expect(stored().tracks).toHaveLength(2)
  })

  it('treats adding an already favorited track as a no-op success', () => {
    const { result } = renderHook(() => useFavorites())
    let again = false
    act(() => {
      result.current.addTrack(mk('1'))
      again = result.current.addTrack(mk('1'), 'note')
    })
    expect(again).toBe(true)
    expect(stored().tracks).toHaveLength(1)
  })

  it('shows a track added by one mounted hook in another', () => {
    const a = renderHook(() => useFavorites())
    const b = renderHook(() => useFavorites())
    act(() => {
      a.result.current.addTrack(mk('1'), 'hi')
    })
    expect(b.result.current.tracks.map((t) => t.id)).toEqual(['1'])
    expect(b.result.current.notes).toEqual({ 'deezer:track:1': 'hi' })
    act(() => {
      b.result.current.removeTrack('deezer:track:1')
    })
    expect(a.result.current.tracks).toEqual([])
  })

  it('stores tracks with preview_url null and keeps is_playable', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'), 'nice')
    })
    expect(stored().tracks[0].preview_url).toBeNull()
    expect(stored().tracks[0].is_playable).toBe(true)
    expect(stored().notes['deezer:track:1']).toBe('nice')
  })

  it('treats malformed or wrong-shaped JSON as empty', () => {
    for (const raw of ['not json', '"x"', 'null', '{"tracks":5,"notes":[]}']) {
      localStorage.setItem(KEY, raw)
      const { result, unmount } = renderHook(() => useFavorites())
      expect(result.current.tracks).toEqual([])
      expect(result.current.notes).toEqual({})
      unmount()
    }
  })

  it('drops stored tracks without an album or artists list', () => {
    const { album: _album, ...noAlbum } = mk('2')
    localStorage.setItem(
      KEY,
      JSON.stringify({
        tracks: [mk('1'), { ...noAlbum, uri: 'deezer:track:2' }, { ...mk('3'), artists: null }],
        notes: {},
      })
    )
    const { result } = renderHook(() => useFavorites())
    expect(result.current.tracks.map((t) => t.uri)).toEqual(['deezer:track:1'])
  })

  it('returns false and leaves state unchanged when setItem throws', () => {
    const { result } = renderHook(() => useFavorites())
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    let ok = true
    act(() => {
      ok = result.current.addTrack(mk('1'))
    })
    expect(ok).toBe(false)
    expect(result.current.tracks).toEqual([])
  })

  it('does not throw when localStorage access is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const { result } = renderHook(() => useFavorites())
    expect(result.current.tracks).toEqual([])
  })

  it('updates from a storage event of another tab', () => {
    const { result } = renderHook(() => useFavorites())
    const next = JSON.stringify({ tracks: [mk('9')], notes: {} })
    act(() => {
      localStorage.setItem(KEY, next)
      window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: next }))
    })
    expect(result.current.tracks.map((t) => t.id)).toEqual(['9'])
  })

  it('fires one change event after the full write', () => {
    const { result } = renderHook(() => useFavorites())
    const seen: number[] = []
    const onChange = () => seen.push(stored().tracks?.length ?? 0)
    window.addEventListener('spoter:favorites-changed', onChange)
    act(() => {
      result.current.addTrack(mk('1'))
    })
    window.removeEventListener('spoter:favorites-changed', onChange)
    expect(seen).toEqual([1])
  })

  it('removeTrack drops the track and its note', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'), 'n')
    })
    act(() => {
      result.current.removeTrack('deezer:track:1')
    })
    expect(result.current.tracks).toEqual([])
    expect(result.current.notes).toEqual({})
    expect(stored().tracks).toEqual([])
  })

  it('setNote updates the note', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
    })
    act(() => {
      result.current.setNote('deezer:track:1', 'hello')
    })
    expect(result.current.notes['deezer:track:1']).toBe('hello')
    expect(stored().notes['deezer:track:1']).toBe('hello')
  })

  it('setNote with an empty note removes it', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'), 'hello')
    })
    act(() => {
      result.current.setNote('deezer:track:1', '')
    })
    expect(result.current.notes).toEqual({})
    expect(stored().notes).toEqual({})
  })

  it('parseNotes loads tracks even when notes is null', () => {
    const track = mk('1')
    localStorage.setItem(KEY, JSON.stringify({ tracks: [track], notes: null }))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.tracks.map((t) => t.id)).toEqual(['1'])
    expect(result.current.notes).toEqual({})
  })

  it('parseNotes treats a string note value as empty object', () => {
    const track = mk('1')
    localStorage.setItem(KEY, JSON.stringify({ tracks: [track], notes: 'ab' }))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.notes).toEqual({})
  })

  it('parseNotes treats an array note value as empty object', () => {
    const track = mk('1')
    localStorage.setItem(KEY, JSON.stringify({ tracks: [track], notes: ['x'] }))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.notes).toEqual({})
  })

  it('parseNotes filters out non-string values', () => {
    const track = mk('1')
    localStorage.setItem(
      KEY,
      JSON.stringify({
        tracks: [track],
        notes: { 'deezer:track:1': 'ok', 'deezer:track:2': 5 },
      })
    )
    const { result } = renderHook(() => useFavorites())
    expect(result.current.notes).toEqual({ 'deezer:track:1': 'ok' })
  })

  it('addTrack returns true on success', () => {
    const { result } = renderHook(() => useFavorites())
    let ok = false
    act(() => {
      ok = result.current.addTrack(mk('1'))
    })
    expect(ok).toBe(true)
  })

  it('setNote returns true on success', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
    })
    let ok = false
    act(() => {
      ok = result.current.setNote('deezer:track:1', 'hello')
    })
    expect(ok).toBe(true)
  })

  it('removeTrack returns true on success', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
    })
    let ok = false
    act(() => {
      ok = result.current.removeTrack('deezer:track:1')
    })
    expect(ok).toBe(true)
  })

  it('removeTrack leaves the other track when removing one', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
      result.current.addTrack(mk('2'))
    })
    act(() => {
      result.current.removeTrack('deezer:track:1')
    })
    expect(result.current.tracks.map((t) => t.uri)).toEqual(['deezer:track:2'])
  })

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
    })
    const next = JSON.stringify({ tracks: [mk('9')], notes: {} })
    act(() => {
      localStorage.setItem(KEY, next)
      window.dispatchEvent(new StorageEvent('storage', { key: 'other-key' }))
    })
    expect(result.current.tracks.map((t) => t.id)).toEqual(['1'])
  })

  it('updates on storage events with null key', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.addTrack(mk('1'))
    })
    const next = JSON.stringify({ tracks: [mk('9')], notes: {} })
    act(() => {
      localStorage.setItem(KEY, next)
      window.dispatchEvent(new StorageEvent('storage', { key: null }))
    })
    expect(result.current.tracks.map((t) => t.id)).toEqual(['9'])
  })

  it('removes event listeners on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useFavorites())
    unmount()
    expect(spy).toHaveBeenCalledWith('storage', expect.any(Function))
    expect(spy).toHaveBeenCalledWith('spoter:favorites-changed', expect.any(Function))
  })
})
