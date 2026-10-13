import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TrackInfo } from '../TrackInfo'
import type { SpotifyTrack } from '@/types/spotify'

const track = {
  id: '1',
  uri: 'u1',
  name: 'Song',
  artists: [{ id: 'a', name: 'Artist' }],
  album: { id: 'b', name: 'Album', images: [] },
} as unknown as SpotifyTrack

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: { currentTrack: track } }),
  useProgress: () => ({ progressMs: 12000, durationMs: 30000 }),
}))

describe('TrackInfo', () => {
  it('shows the track and the useProgress times', () => {
    render(
      <MemoryRouter>
        <TrackInfo notes={{}} />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Song').length).toBeGreaterThan(0)
    expect(screen.getByText('0:12')).toBeInTheDocument()
    expect(screen.getByText('0:30')).toBeInTheDocument()
  })
})
