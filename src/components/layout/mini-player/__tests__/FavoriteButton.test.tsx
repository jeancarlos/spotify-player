import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack: SpotifyTrack = {
  id: 't1',
  uri: 'spotify:track:t1',
  name: 'Test Track',
  duration_ms: 180000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
}

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockPlayerState = { currentTrack: mockTrack as SpotifyTrack | null, isPlaying: false }
vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({ state: mockPlayerState, dispatch: vi.fn() }),
}))

vi.mock('@/components/layout/mini-player/PlaybackControls', () => ({
  ControlTip: () => null,
}))

import { FavoriteButton } from '@/components/layout/mini-player/FavoriteButton'

const addTrack = vi.fn()
const removeTrack = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockPlayerState.currentTrack = mockTrack
})

describe('FavoriteButton', () => {
  it('retorna null quando não há currentTrack', () => {
    mockPlayerState.currentTrack = null
    const { container } = render(
      <FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderiza o botão de coração quando há currentTrack', () => {
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('aria-label indica "adicionar" quando isSaved=false', () => {
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    expect(screen.getByRole('button', { name: /favorites\.addToList/i })).toBeInTheDocument()
  })

  it('aria-label indica "remover" quando isSaved=true', () => {
    render(<FavoriteButton isSaved={true} addTrack={addTrack} removeTrack={removeTrack} />)
    expect(screen.getByRole('button', { name: /favorites\.removeFromList/i })).toBeInTheDocument()
  })

  it('click quando não salvo chama addTrack com a track atual', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(addTrack).toHaveBeenCalledWith(mockTrack)
    expect(removeTrack).not.toHaveBeenCalled()
  })

  it('click quando salvo chama removeTrack com o uri da track', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={true} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(removeTrack).toHaveBeenCalledWith('spotify:track:t1')
    expect(addTrack).not.toHaveBeenCalled()
  })

  it('dispara toast ao adicionar', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(mockToast).toHaveBeenCalled()
  })

  it('dispara toast ao remover', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={true} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(mockToast).toHaveBeenCalled()
  })
})
