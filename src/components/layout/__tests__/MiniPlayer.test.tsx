import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MiniPlayer } from '../MiniPlayer'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

let mockTrack: unknown = null
vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: { currentTrack: mockTrack } }),
}))
vi.mock('@/hooks/useFavorites', () => ({ useFavorites: () => ({ notes: {} }) }))
vi.mock('../mini-player/ProgressBar', () => ({ ProgressBar: () => <i data-testid="progress" /> }))
vi.mock('../mini-player/TrackInfo', () => ({ TrackInfo: () => <i data-testid="info" /> }))
vi.mock('../mini-player/PlaybackControls', () => ({ PlaybackControls: () => <i data-testid="controls" /> }))
vi.mock('../mini-player/FavoriteButton', () => ({ FavoriteButton: () => <i data-testid="fav" /> }))

describe('MiniPlayer', () => {
  it('hides the progress bar without a track', () => {
    mockTrack = null
    render(<MiniPlayer />)
    expect(screen.queryByTestId('progress')).toBeNull()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(screen.getByLabelText('lyrics.nowPlaying')).toBeInTheDocument()
  })

  it('shows the progress bar with a track', () => {
    mockTrack = { uri: 'u' }
    render(<MiniPlayer />)
    expect(screen.getByTestId('progress')).toBeInTheDocument()
    expect(screen.getByTestId('info')).toBeInTheDocument()
    expect(screen.getByTestId('fav')).toBeInTheDocument()
  })
})
