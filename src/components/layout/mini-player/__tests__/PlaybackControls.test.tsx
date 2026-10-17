import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { PlaybackControls } from '../PlaybackControls'
import { PlayerContext } from '@/contexts/PlayerContext'
import { initialPlayerState } from '@/contexts/playerReducer'
import type { Track } from '@/types/music'

const playingState = { ...initialPlayerState, currentTrack: { id: '1', name: 'Song' } as Track }

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
  const state = { ...playingState, ...overrides }
  render(
    <MemoryRouter>
      <PlayerContext.Provider value={{ state, controls }}>
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

  it('disables play while a preview is loading', () => {
    const controls = setup({ isLoading: true })
    const btn = screen.getByRole('button', { name: 'player.play' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(controls.toggle).not.toHaveBeenCalled()
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

function Probe() {
  const l = useLocation()
  return (
    <output data-testid="loc">{JSON.stringify({ p: l.pathname + l.search, s: l.state })}</output>
  )
}

function setupAt(entry: Parameters<typeof MemoryRouter>[0]['initialEntries']) {
  render(
    <MemoryRouter initialEntries={entry}>
      <PlayerContext.Provider value={{ state: playingState, controls: {} } as never}>
        <PlaybackControls />
        <Probe />
      </PlayerContext.Provider>
    </MemoryRouter>
  )
  return () => JSON.parse(screen.getByTestId('loc').textContent) as { p: string; s: unknown }
}

describe('PlaybackControls queue toggle', () => {
  type Entry = Parameters<typeof setupAt>[0]
  it.each<[string, Entry, string, { p: string; s?: unknown }]>([
    [
      'opens the queue tab and remembers the full path with its query',
      ['/playlists/9?page=2'],
      'player.queue',
      { p: '/player?tab=queue', s: { from: '/playlists/9?page=2' } },
    ],
    [
      'reaches the queue from the lyrics tab keeping the state',
      [{ pathname: '/player', search: '?tab=lyrics', state: { from: '/x?y=1' } }],
      'player.queue',
      { p: '/player?tab=queue', s: { from: '/x?y=1' } },
    ],
    [
      'closes the queue back to where the player was opened',
      [{ pathname: '/player', search: '?tab=queue', state: { from: '/x?y=1' } }],
      'player.closeQueue',
      { p: '/x?y=1' },
    ],
  ])('%s', (_name, entry, button, expected) => {
    const loc = setupAt(entry)
    fireEvent.click(screen.getByRole('button', { name: button }))
    expect(loc()).toMatchObject(expected)
  })

  it('renders nothing without a track', () => {
    setup({ currentTrack: null })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('marks shuffle as active', () => {
    setup({ shuffle: true })
    expect(screen.getByRole('button', { name: 'player.shuffle' })).toHaveClass('bg-black/10')
  })
})
