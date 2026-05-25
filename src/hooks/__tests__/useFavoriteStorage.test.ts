import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavoriteStorage } from '@/hooks/useFavoriteStorage'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/utils/favCookie', () => ({
  readFavCookie: vi.fn(() => []),
  writeFavCookie: vi.fn(),
}))
vi.mock('@/utils/favHydration', () => ({
  hydrateFromApi: vi.fn().mockResolvedValue([]),
}))

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
    images: [{ url: 'https://img.example.com/1.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useFavoriteStorage', () => {
  it('inicia com lista vazia quando localStorage está limpo', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    expect(result.current.tracks).toHaveLength(0)
  })

  it('inicia com tracks existentes no localStorage', () => {
    localStorage.setItem('spoter_favorites_u1', JSON.stringify([mockTrack('t1')]))
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t1')
  })

  it('addTrack adiciona track e retorna true', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    let added: boolean | undefined
    act(() => {
      added = result.current.addTrack(mockTrack('t2'))
    })
    expect(added).toBe(true)
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t2')
  })

  it('addTrack ignora duplicata e retorna false', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t3'))
    })
    let added: boolean | undefined
    act(() => {
      added = result.current.addTrack(mockTrack('t3'))
    })
    expect(added).toBe(false)
    expect(result.current.tracks).toHaveLength(1)
  })

  it('addTrack com nota persiste a nota', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t4'), 'ouço no treino')
    })
    expect(result.current.notes['spotify:track:t4']).toBe('ouço no treino')
  })

  it('removeTrack remove por uri e retorna true', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t5'))
    })
    let removed: boolean | undefined
    act(() => {
      removed = result.current.removeTrack('spotify:track:t5')
    })
    expect(removed).toBe(true)
    expect(result.current.tracks).toHaveLength(0)
  })

  it('removeTrack remove a nota associada', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t6'), 'nota importante')
    })
    act(() => {
      result.current.removeTrack('spotify:track:t6')
    })
    expect(result.current.notes['spotify:track:t6']).toBeUndefined()
  })

  it('replaceTracks substitui toda a lista', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('old1'))
      result.current.addTrack(mockTrack('old2'))
    })
    act(() => {
      result.current.replaceTracks([mockTrack('new1')])
    })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('new1')
  })

  it('reage ao evento spoter:favorites-changed disparado externamente', () => {
    localStorage.setItem('spoter_favorites_u1', JSON.stringify([mockTrack('ext1')]))
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    expect(result.current.tracks).toHaveLength(1)

    act(() => {
      localStorage.setItem('spoter_favorites_u1', JSON.stringify([mockTrack('ext1'), mockTrack('ext2')]))
      window.dispatchEvent(new CustomEvent('spoter:favorites-changed'))
    })
    expect(result.current.tracks).toHaveLength(2)
  })
})
