import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ArtistDetail } from '../ArtistDetail'
import type { Track } from '@/types/music'

const top = [{ id: 't1', name: 'First' }] as unknown as Track[]

const hook = {
  topTracks: { data: top as Track[] | undefined },
  discographyView: 'list',
  setDiscographyView: vi.fn(),
  albumPage: 1,
  setAlbumPage: vi.fn(),
  headerHeight: 0,
  hasNextAlbums: false,
  handleHeaderHeightChange: vi.fn(),
  handleAlbumClick: vi.fn(),
  playTrack: vi.fn(() => Promise.resolve()),
  artistImages: [],
  artistName: 'Artist',
  artistLink: undefined,
  albumItems: [],
  activeTrackId: undefined,
  notFound: false,
}

const captured = {
  chart: undefined as undefined | { onPlay: (t: Track) => Promise<void> },
  disco: undefined as undefined | { onPrevPage: () => void; onNextPage: () => void },
}

vi.mock('@/hooks/useArtistDetailPage', () => ({ useArtistDetailPage: () => hook }))
vi.mock('@/components/artist/ArtistHeader', () => ({ ArtistHeader: () => <div /> }))
vi.mock('@/components/artist/ArtistBio', () => ({ ArtistBio: () => <div /> }))
vi.mock('@/components/artist/ArtistTopTracksChart', () => ({
  ArtistTopTracksChart: (props: { onPlay: (t: Track) => Promise<void> }) => {
    captured.chart = props
    return <div data-testid="chart" />
  },
}))
vi.mock('@/components/artist/ArtistDiscography', () => ({
  ArtistDiscography: (props: { onPrevPage: () => void; onNextPage: () => void }) => {
    captured.disco = props
    return <div />
  },
}))

function renderPage() {
  render(
    <MemoryRouter>
      <ArtistDetail />
    </MemoryRouter>
  )
}

describe('ArtistDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    hook.notFound = false
    hook.topTracks = { data: top }
  })

  it('shows a not-found state', () => {
    hook.notFound = true
    renderPage()
    expect(screen.getByText('common.notFound')).toBeInTheDocument()
  })

  it('plays a top track with the top-track list', async () => {
    renderPage()
    await captured.chart?.onPlay(top[0])
    expect(hook.playTrack).toHaveBeenCalledWith(top[0], top)
  })

  it('hides the top tracks section without data', () => {
    hook.topTracks = { data: undefined }
    renderPage()
    expect(screen.queryByTestId('chart')).toBeNull()
  })

  it('pages the discography with a floor of one', () => {
    renderPage()
    act(() => {
      captured.disco?.onPrevPage()
      captured.disco?.onNextPage()
    })
    const [prev, next] = hook.setAlbumPage.mock.calls.map((c) => (c as unknown as [(p: number) => number])[0])
    expect(prev(1)).toBe(1)
    expect(prev(3)).toBe(2)
    expect(next(3)).toBe(4)
  })
})
