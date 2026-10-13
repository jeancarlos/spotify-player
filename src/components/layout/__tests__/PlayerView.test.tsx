import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlayerView } from '../PlayerView'

const seek = vi.fn()
const track = {
  name: 'Song',
  duration_ms: 90000,
  artists: [{ name: 'Artist' }],
  album: { name: 'Album', images: [] },
}

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({
    state: { currentTrack: track },
    controls: { seek },
  }),
  useProgress: () => ({ progressMs: 12000, durationMs: 90000 }),
}))
vi.mock('@/hooks/queries/useLyrics', () => ({
  useLyrics: () => ({
    isPending: false,
    data: [
      { time: 0, text: 'First' },
      { time: 10000, text: 'Second' },
      { time: 20000, text: 'Third' },
    ],
  }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('@/components/layout/TrackInfoPanel', () => ({ TrackInfoPanel: () => null }))
vi.mock('@/components/layout/PlayerQueue', () => ({ PlayerQueue: () => null }))

describe('PlayerView', () => {
  it('highlights the line at useProgress().progressMs and seeks on click', () => {
    render(
      <MemoryRouter>
        <PlayerView />
      </MemoryRouter>
    )
    expect(screen.getByText('Second')).toHaveClass('font-bold')
    fireEvent.click(screen.getByText('Third'))
    expect(seek).toHaveBeenCalledWith(20000)
  })
})
