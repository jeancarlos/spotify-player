import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PlayerView } from '../PlayerView'
import { PlayerContext } from '@/contexts/PlayerContext'
import { initialPlayerState } from '@/contexts/playerReducer'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/hooks/queries/useLyrics', () => ({
  useLyrics: () => ({ isPending: false, data: [{ timeMs: 0, text: 'la' }] }),
}))
vi.mock('@/components/layout/LyricsView', () => ({ LyricsView: () => <div /> }))
vi.mock('@/components/layout/TrackInfoPanel', () => ({ TrackInfoPanel: () => <div /> }))
vi.mock('@/components/layout/PlayerQueue', () => ({ PlayerQueue: () => <div /> }))
vi.mock('@/contexts/PlayerContext', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  useProgress: () => ({ progressMs: 0, durationMs: 0 }),
}))

function Probe() {
  const l = useLocation()
  return <output data-testid="loc">{JSON.stringify({ p: l.pathname + l.search, s: l.state })}</output>
}

function setup() {
  const track = {
    id: '1',
    name: 'Song',
    duration_ms: 1000,
    artists: [{ name: 'A' }],
    album: { name: 'B', images: [] },
  } as unknown as SpotifyTrack
  const controls = { seek: vi.fn() }
  render(
    <MemoryRouter initialEntries={[{ pathname: '/player', search: '?tab=lyrics', state: { from: '/playlists/9?page=2' } }]}>
      <PlayerContext.Provider value={{ state: { ...initialPlayerState, currentTrack: track }, controls } as never}>
        <Routes>
          <Route path="/player" element={<PlayerView />} />
          <Route path="*" element={null} />
        </Routes>
        <Probe />
      </PlayerContext.Provider>
    </MemoryRouter>
  )
}

describe('PlayerView', () => {
  it('keeps location.state when switching tabs', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /player.queue/ }))
    const loc = JSON.parse(screen.getByTestId('loc').textContent)
    expect(loc.p).toBe('/player?tab=queue')
    expect(loc.s).toEqual({ from: '/playlists/9?page=2' })
  })

  it('back returns to the full from path with its query', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'back' }))
    expect(JSON.parse(screen.getByTestId('loc').textContent).p).toBe('/playlists/9?page=2')
  })
})
