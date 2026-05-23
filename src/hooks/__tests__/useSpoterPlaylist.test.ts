import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/queries/useUserPlaylists', () => ({
  useUserPlaylists: () => ({
    data: {
      items: [{ id: 'pl-123', name: 'Spoter List' }],
    },
  }),
}))
vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: () => ({ data: { items: [] } }),
}))
vi.mock('@/hooks/mutations/useCreatePlaylist', () => ({
  useCreatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useAddToPlaylist', () => ({
  useAddToPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useRemoveFromPlaylist', () => ({
  useRemoveFromPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { profile: { id: 'user-1' } } }),
}))

import { renderHook } from '@testing-library/react'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'

describe('useSpoterPlaylist', () => {
  it('encontra a playlist "Spoter List" existente e salva o id', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.playlistId).toBe('pl-123')
  })

  it('expõe lista de tracks (vazia aqui)', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.tracks).toHaveLength(0)
  })
})
