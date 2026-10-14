import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Track } from '@/types/music'

const mockTrack: Track = {
  id: 't1',
  uri: 'deezer:track:t1',
  name: 'Test Track',
  duration_ms: 180000,
  explicit: false,
  rank: 80,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'deezer:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'deezer:album:alb1',
    type: 'album',
  },
}

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockPlayerState = { currentTrack: mockTrack as Track | null, isPlaying: false }
vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: mockPlayerState }),
}))

vi.mock('@/components/layout/mini-player/PlaybackControls', () => ({
  ControlTip: () => null,
}))

const mockFavorites = {
  tracks: [] as Track[],
  addTrack: vi.fn(() => true),
  removeTrack: vi.fn(() => true),
}
vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => mockFavorites,
}))

import { FavoriteButton } from '@/components/layout/mini-player/FavoriteButton'

const { addTrack, removeTrack } = mockFavorites

beforeEach(() => {
  vi.clearAllMocks()
  mockPlayerState.currentTrack = mockTrack
  mockFavorites.tracks = []
  addTrack.mockReturnValue(true)
  removeTrack.mockReturnValue(true)
})

describe('FavoriteButton', () => {
  it('retorna null quando não há currentTrack', () => {
    mockPlayerState.currentTrack = null
    const { container } = render(<FavoriteButton />)
    expect(container.firstChild).toBeNull()
  })

  it('aria-label indica "adicionar" quando a track não é favorita', () => {
    render(<FavoriteButton />)
    expect(screen.getByRole('button', { name: /favorites\.addToList/i })).toBeInTheDocument()
  })

  it('aria-label indica "remover" quando a track é favorita', () => {
    mockFavorites.tracks = [mockTrack]
    render(<FavoriteButton />)
    expect(screen.getByRole('button', { name: /favorites\.removeFromList/i })).toBeInTheDocument()
  })

  it('click quando não salvo chama addTrack e mostra toast de sucesso', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton />)
    await user.click(screen.getByRole('button'))
    expect(addTrack).toHaveBeenCalledWith(mockTrack)
    expect(removeTrack).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith('favorites.addedToList', 'success')
  })

  it('click quando salvo chama removeTrack e mostra toast', async () => {
    const user = userEvent.setup()
    mockFavorites.tracks = [mockTrack]
    render(<FavoriteButton />)
    await user.click(screen.getByRole('button'))
    expect(removeTrack).toHaveBeenCalledWith('deezer:track:t1')
    expect(addTrack).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith('favorites.removedFromList', 'info')
  })

  it('mostra toast de erro quando addTrack falha', async () => {
    const user = userEvent.setup()
    addTrack.mockReturnValue(false)
    render(<FavoriteButton />)
    await user.click(screen.getByRole('button'))
    expect(mockToast).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith('favorites.saveFailed', 'error')
  })

  it('mostra toast de erro quando removeTrack falha', async () => {
    const user = userEvent.setup()
    mockFavorites.tracks = [mockTrack]
    removeTrack.mockReturnValue(false)
    render(<FavoriteButton />)
    await user.click(screen.getByRole('button'))
    expect(mockToast).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith('favorites.saveFailed', 'error')
  })
})
