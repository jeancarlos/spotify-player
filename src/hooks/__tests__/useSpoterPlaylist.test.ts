import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/hooks/queries/useUserPlaylists', () => ({
  useUserPlaylists: () => ({
    isSuccess: true,
    data: { items: [{ id: 'pl-123', name: "User's Spoter List" }] },
  }),
}))
vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: () => ({ isSuccess: false, data: null }),
}))
vi.mock('@/hooks/mutations/useCreatePlaylist', () => ({
  useCreatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useUpdatePlaylist', () => ({
  useUpdatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useUploadPlaylistCover', () => ({
  useUploadPlaylistCover: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useAddToPlaylist', () => ({
  useAddToPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useRemoveFromPlaylist', () => ({
  useRemoveFromPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useReorderPlaylistTracks', () => ({
  useReorderPlaylistTracks: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))
vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn() },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { profile: { id: 'user-1', display_name: 'User' } } }),
}))
vi.mock('@/utils/favHydration', () => ({
  hydrateFromApi: vi.fn().mockResolvedValue([]),
}))

import { renderHook, act } from '@testing-library/react'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { writeLocalTracks, readLocalTracks } from '@/utils/favStorage'
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
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/=.*/, '=;max-age=0;path=/')
  })
})

describe('useSpoterPlaylist', () => {
  it('encontra a playlist existente pelo nome', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.playlistId).toBe('pl-123')
  })

  it('inicia com tracks do localStorage', () => {
    writeLocalTracks('user-1', [mockTrack('t1')])
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t1')
  })

  it('addTrack persiste no localStorage', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t2'))
    })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t2')
  })

  it('addTrack ignora duplicata', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t3'))
      result.current.addTrack(mockTrack('t3'))
    })
    expect(result.current.tracks).toHaveLength(1)
  })

  it('removeTrack remove a track', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t4'))
    })
    act(() => {
      result.current.removeTrack('spotify:track:t4')
    })
    expect(result.current.tracks).toHaveLength(0)
  })

  it('updateNote salva e remove nota', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t5'))
    })
    act(() => {
      result.current.updateNote('spotify:track:t5', 'ouço no gym')
    })
    expect(result.current.notes['spotify:track:t5']).toBe('ouço no gym')
    act(() => {
      result.current.updateNote('spotify:track:t5', '')
    })
    expect(result.current.notes['spotify:track:t5']).toBeUndefined()
  })

  describe('reorderTrack', () => {
    it('move track para frente na lista', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(0, 2)
      })

      expect(result.current.tracks[0].id).toBe('t2')
      expect(result.current.tracks[1].id).toBe('t3')
      expect(result.current.tracks[2].id).toBe('t1')
    })

    it('move track para trás na lista', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(2, 0)
      })

      expect(result.current.tracks[0].id).toBe('t3')
      expect(result.current.tracks[1].id).toBe('t1')
      expect(result.current.tracks[2].id).toBe('t2')
    })

    it('não faz nada quando fromIndex === toIndex', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2')])
      const { result } = renderHook(() => useSpoterPlaylist())
      const before = [...result.current.tracks]

      act(() => {
        result.current.reorderTrack(1, 1)
      })

      expect(result.current.tracks).toEqual(before)
    })

    it('faz clamp de toIndex quando maior que o tamanho da lista', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(0, 99)
      })

      expect(result.current.tracks[2].id).toBe('t1')
    })

    it('persiste nova ordem no localStorage', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(0, 2)
      })

      const saved = readLocalTracks('user-1')
      expect(saved[2].id).toBe('t1')
    })
  })
})
