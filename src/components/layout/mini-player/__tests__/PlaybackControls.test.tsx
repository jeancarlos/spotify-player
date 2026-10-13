import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlaybackControls } from '../PlaybackControls'
import { PlayerContext } from '@/contexts/PlayerContext'
import { initialPlayerState } from '@/contexts/playerReducer'
import type { SpotifyTrack } from '@/types/spotify'

function setup(overrides: Partial<typeof initialPlayerState> = {}) {
  const controls = {
    playTrack: vi.fn(() => Promise.resolve()),
    toggle: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    seek: vi.fn(),
    setShuffle: vi.fn(),
    cycleRepeat: vi.fn(),
  }
  const state = {
    ...initialPlayerState,
    currentTrack: { id: '1', name: 'Song' } as SpotifyTrack,
    ...overrides,
  }
  render(
    
      <MemoryRouter>
        <PlayerContext.Provider value={{ state, dispatch: vi.fn(), controls }}>
          <PlaybackControls />
        </PlayerContext.Provider>
      </MemoryRouter>
    
  )
  return controls
}

describe('PlaybackControls', () => {
  it('calls toggle from the play button', () => {
    const controls = setup()
    fireEvent.click(screen.getByRole('button', { name: 'player.play' }))
    expect(controls.toggle).toHaveBeenCalledOnce()
  })

  it('labels the button Pause while playing', () => {
    setup({ isPlaying: true })
    expect(screen.getByRole('button', { name: 'player.pause' })).toBeInTheDocument()
  })

  it('calls next and previous', () => {
    const controls = setup()
    fireEvent.click(screen.getByRole('button', { name: 'player.next' }))
    fireEvent.click(screen.getByRole('button', { name: 'player.previous' }))
    expect(controls.next).toHaveBeenCalledOnce()
    expect(controls.previous).toHaveBeenCalledOnce()
  })

  it('shuffle exposes aria-pressed and flips the value', () => {
    const controls = setup({ shuffle: false })
    const btn = screen.getByRole('button', { name: 'player.shuffle' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(controls.setShuffle).toHaveBeenCalledWith(true)
  })

  it('repeat exposes aria-pressed and cycles', () => {
    const controls = setup({ repeat: 'track' })
    const btn = screen.getByRole('button', { name: 'player.repeat' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(btn)
    expect(controls.cycleRepeat).toHaveBeenCalledOnce()
  })
})
