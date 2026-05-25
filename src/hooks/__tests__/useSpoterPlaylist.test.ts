import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks must be declared before imports (Vitest hoisting)
vi.mock('@/hooks/queries/useUserPlaylists', () => ({
  useUserPlaylists: vi.fn(() => ({
    isSuccess: true,
    data: { items: [{ id: 'pl-123', name: "User's Spoter List", owner: { id: 'user-1' } }] },
  })),
}))
vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: () => ({ isSuccess: false, data: null }),
}))

const mockCreateMutate = vi.fn()
vi.mock('@/hooks/mutations/useCreatePlaylist', () => ({
  useCreatePlaylist: () => ({ mutate: mockCreateMutate }),
}))
vi.mock('@/hooks/mutations/useUpdatePlaylist', () => ({
  useUpdatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useUploadPlaylistCover', () => ({
  useUploadPlaylistCover: () => ({ mutate: vi.fn() }),
}))

const mockAddMutate = vi.fn()
vi.mock('@/hooks/mutations/useAddToPlaylist', () => ({
  useAddToPlaylist: () => ({ mutate: mockAddMutate }),
}))
vi.mock('@/hooks/mutations/useRemoveFromPlaylist', () => ({
  useRemoveFromPlaylist: () => ({ mutate: vi.fn() }),
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
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
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
  vi.clearAllMocks()
  // Restore default mock: playlist found by name
  vi.mocked(useUserPlaylists).mockReturnValue({
    isSuccess: true,
    data: { items: [{ id: 'pl-123', name: "User's Spoter List", owner: { id: 'user-1' } }] },
  } as ReturnType<typeof useUserPlaylists>)
})

describe('useSpoterPlaylist — encontra playlist existente', () => {
  it('encontra a playlist existente pelo nome e dono', () => {
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
})

describe('useSpoterPlaylist — criação lazy (sem playlist existente)', () => {
  beforeEach(() => {
    vi.mocked(useUserPlaylists).mockReturnValue({
      isSuccess: true,
      data: { items: [] },
    } as ReturnType<typeof useUserPlaylists>)
  })

  it('não há playlistId quando nenhuma playlist é encontrada', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.playlistId).toBe('')
  })

  it('addTrack sem playlistId chama createPlaylist.mutate', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('new1'))
    })
    expect(mockCreateMutate).toHaveBeenCalledWith(
      { userId: 'user-1', name: expect.stringContaining('Spoter') },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('addTrack adiciona a track localmente mesmo antes da criação completar', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('new2'))
    })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('new2')
  })

  it('após playlistId existente, addTrack usa addMutation sem criar de novo', () => {
    localStorage.setItem('spoter_playlist_user-1', 'existing-pl')
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t5'))
    })
    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(mockAddMutate).toHaveBeenCalledWith({ playlistId: 'existing-pl', uris: ['spotify:track:t5'] })
  })
})
