import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayTrack } from '@/hooks/usePlayTrack'

// Mock dependencies
vi.mock('@/lib/axios', () => ({
  default: { put: vi.fn() },
}))
vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({ state: { isPlaying: false }, dispatch: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

import api from '@/lib/axios'

const mockTrack = {
  id: 't1', uri: 'spotify:track:t1', name: 'Test',
  duration_ms: 200000, explicit: false, popularity: 80,
  preview_url: null, type: 'track' as const,
  artists: [{ id: 'a1', name: 'Artist', uri: 'spotify:artist:a1', type: 'artist' as const }],
  album: {
    id: 'al1', name: 'Album', images: [], release_date: '2024',
    album_type: 'album' as const, artists: [], uri: 'spotify:album:al1', type: 'album' as const,
  },
}

describe('usePlayTrack', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PUT /me/player/play com uri correto', async () => {
    vi.mocked(api.put).mockResolvedValue({ status: 204 })
    const { result } = renderHook(() => usePlayTrack())
    await act(() => result.current(mockTrack))
    expect(api.put).toHaveBeenCalledWith('/me/player/play', { uris: ['spotify:track:t1'] })
  })

  it('não lança exceção quando API retorna 404 (sem device)', async () => {
    const err = Object.assign(new Error('no device'), { response: { status: 404 } })
    vi.mocked(api.put).mockRejectedValue(err)
    const { result } = renderHook(() => usePlayTrack())
    await expect(act(() => result.current(mockTrack))).resolves.not.toThrow()
  })
})
