import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsTrackFavorite } from '@/hooks/useIsTrackFavorite'
import { writeLocalTracks } from '@/utils/favStorage'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack = (id: string): SpotifyTrack => ({
  id,
  uri: `spotify:track:${id}`,
  name: `Track ${id}`,
  duration_ms: 180000,
  explicit: false,
  popularity: 50,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Artista', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Álbum',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
})

beforeEach(() => {
  localStorage.clear()
})

describe('useIsTrackFavorite', () => {
  it('retorna false quando uri é null', () => {
    const { result } = renderHook(() => useIsTrackFavorite(null, 'u1'))
    expect(result.current).toBe(false)
  })

  it('retorna false quando userId é vazio', () => {
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t1', ''))
    expect(result.current).toBe(false)
  })

  it('retorna false quando track não está no localStorage', () => {
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t1', 'u1'))
    expect(result.current).toBe(false)
  })

  it('retorna true quando track existe no localStorage', () => {
    writeLocalTracks('u1', [mockTrack('t1')])
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t1', 'u1'))
    expect(result.current).toBe(true)
  })

  it('atualiza reativamente ao evento spoter:favorites-changed', () => {
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t2', 'u1'))
    expect(result.current).toBe(false)

    act(() => {
      writeLocalTracks('u1', [mockTrack('t2')])
    })

    expect(result.current).toBe(true)
  })
})
