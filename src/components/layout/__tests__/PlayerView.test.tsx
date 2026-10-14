import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PlayerView } from '../PlayerView'
import { PlayerContext } from '@/contexts/PlayerContext'
import { initialPlayerState } from '@/contexts/playerReducer'
import type { Track } from '@/types/music'

const lyricsSpy = vi.hoisted(() => vi.fn())
let lyricsResult: object = { isPending: false, isLoading: false, data: ['la'] }
vi.mock('@/hooks/queries/useLyrics', () => ({
  useLyrics: () => lyricsResult,
}))
vi.mock('@/components/layout/LyricsView', () => ({ LyricsView: (p: { lines: string[] }) => {
    lyricsSpy(p.lines)
    return <div data-testid="lyrics-view" />
  } }))
vi.mock('@/components/layout/TrackInfoPanel', () => ({ TrackInfoPanel: () => <div data-testid="info-panel" /> }))
vi.mock('@/components/layout/PlayerQueue', () => ({ PlayerQueue: () => <div data-testid="queue-panel" /> }))
vi.mock('@/contexts/PlayerContext', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  useProgress: () => {
    throw new Error('PlayerView must not re-render on every timeupdate')
  },
}))

function Probe() {
  const l = useLocation()
  return <output data-testid="loc">{JSON.stringify({ p: l.pathname + l.search, s: l.state })}</output>
}

function setup(withTrack = true) {
  const track = {
    id: '1',
    name: 'Song',
    duration_ms: 1000,
    artists: [{ name: 'A' }],
    album: { name: 'B', images: [] },
  } as unknown as Track
  const controls = { seek: vi.fn() }
  render(
    <MemoryRouter initialEntries={[{ pathname: '/player', search: '?tab=lyrics', state: { from: '/playlists/9?page=2' } }]}>
      <PlayerContext.Provider value={{ state: { ...initialPlayerState, currentTrack: withTrack ? track : null }, controls } as never}>
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
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(JSON.parse(screen.getByTestId('loc').textContent).p).toBe('/playlists/9?page=2')
  })

  it('gives every tab button an aria-label', () => {
    setup()
    for (const key of ['player.lyrics', 'track.songDetails', 'player.queue']) {
      expect(screen.getByRole('button', { name: key })).toHaveAttribute('aria-label', key)
    }
  })

  it('shows the no-track state instead of searching forever', () => {
    lyricsResult = { isPending: true, isLoading: false, data: undefined }
    setup(false)
    expect(screen.getByText('player.noTrack')).toBeInTheDocument()
    expect(screen.queryByText('lyrics.searching')).toBeNull()
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
  })
})

describe('PlayerView panes', () => {
  const mk = (extra: object = {}) =>
    ({
      id: '1',
      name: 'Song',
      duration_ms: 1000,
      artists: [{ name: 'A' }],
      album: { name: 'B', images: [{ url: 'cover.jpg' }] },
      ...extra,
    }) as unknown as Track

  const mount = (track: Track | null, search = '', state?: object) =>
    render(
      <MemoryRouter initialEntries={[{ pathname: '/player', search, state }]}>
        <PlayerContext.Provider value={{ state: { ...initialPlayerState, currentTrack: track }, controls: {} } as never}>
          <Routes>
            <Route path="/player" element={<PlayerView />} />
            <Route path="*" element={<Probe />} />
          </Routes>
        </PlayerContext.Provider>
      </MemoryRouter>
    )

  it('renders the blurred cover and the lyrics pane by default', async () => {
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
    const { container } = mount(mk())
    expect(await screen.findByTestId('lyrics-view')).toBeInTheDocument()
    expect(container.innerHTML).toContain('cover.jpg')
  })

  it('omits the cover and falls back to empty fields without artist or art', async () => {
    const { container } = mount(
      mk({ artists: [], album: { name: 'B', images: [] } }),
      '?tab=queue'
    )
    expect(await screen.findByTestId('queue-panel')).toBeInTheDocument()
    expect(container.innerHTML).not.toContain('blur(100px)')
  })

  it('shows the info pane', async () => {
    mount(mk(), '?tab=info')
    expect(await screen.findByTestId('info-panel')).toBeInTheDocument()
  })

  it('shows the searching state while lyrics load', async () => {
    lyricsResult = { isPending: true, isLoading: true, data: undefined }
    mount(mk())
    expect(await screen.findByText('lyrics.searching')).toBeInTheDocument()
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
  })

  it('redirects to the info tab and hides the lyrics tab when there are none', async () => {
    lyricsResult = { isPending: false, isLoading: false, data: [] }
    mount(mk(), '?tab=lyrics')
    expect(await screen.findByTestId('info-panel')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'player.lyrics' })).toBeNull()
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
  })

  it('hides the lyrics tab when the lyrics query has no data', async () => {
    lyricsResult = { isPending: false, isLoading: false, data: undefined }
    mount(mk(), '?tab=queue')
    expect(await screen.findByTestId('queue-panel')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'player.lyrics' })).toBeNull()
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
  })

  it('treats a missing duration as zero', async () => {
    mount(mk({ duration_ms: undefined }))
    expect(await screen.findByTestId('lyrics-view')).toBeInTheDocument()
  })

  it('switches between the lyrics and info tabs', async () => {
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
    mount(mk(), '?tab=queue')
    fireEvent.click(await screen.findByRole('button', { name: 'player.lyrics' }))
    expect(await screen.findByTestId('lyrics-view')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'track.songDetails' }))
    expect(await screen.findByTestId('info-panel')).toBeInTheDocument()
  })

  it('renders an empty lyrics view for one frame when the query has no data', () => {
    lyricsResult = { isPending: false, isLoading: false, data: undefined }
    mount(mk(), '?tab=lyrics')
    expect(lyricsSpy).toHaveBeenCalledWith([])
    lyricsResult = { isPending: false, isLoading: false, data: ['la'] }
  })
})
