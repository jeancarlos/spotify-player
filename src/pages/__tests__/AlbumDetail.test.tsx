import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AlbumDetail } from '../AlbumDetail'
import type { Track } from '@/types/music'

const tracks = [{ id: 't1', name: 'First' }] as unknown as Track[]

const hook = {
  albumItems: tracks,
  handleTrackPlay: vi.fn(() => Promise.resolve()),
  playerState: { currentTrack: null } as { currentTrack: { id: string } | null },
  view: 'list',
  setView: vi.fn(),
  page: 3,
  setPage: vi.fn(),
  headerHeight: 0,
  hasNext: false,
  albumYear: '2020',
  albumSubtitle: 'sub',
  images: [],
  albumName: 'Album',
  albumArtists: [],
  albumLink: undefined,
  handlePlay: vi.fn(),
  handleLayout: vi.fn(),
  handleArtistClick: vi.fn(),
  notFound: false,
  t: (k: string) => k,
}

const captured = {
  pagination: undefined as undefined | { onPrev: () => void; onNext: () => void },
  row: undefined as undefined | { index: number; onPlay: (t: Track) => Promise<void> },
  table: undefined as undefined | { onPlay: (t: Track, i: number) => void },
}

vi.mock('@/hooks/useAlbumDetailPage', () => ({
  ALBUM_LIMIT: 20,
  useAlbumDetailPage: () => hook,
}))
vi.mock('@/components/shared/CollectionHeader', () => ({ CollectionHeader: () => <div /> }))
vi.mock('@/components/shared/ListTableSwitch', () => ({ ListTableSwitch: () => <div /> }))
vi.mock('@/components/shared/Pagination', () => ({
  Pagination: (props: { onPrev: () => void; onNext: () => void }) => {
    captured.pagination = props
    return <div />
  },
}))
vi.mock('@/components/shared/TrackRow', () => ({
  TrackRow: (props: { isActive: boolean; index: number; onPlay: (t: Track) => Promise<void> }) => {
    captured.row = props
    return <div data-testid="row" data-active={String(props.isActive)} />
  },
}))
vi.mock('@/components/shared/TrackTable', () => ({
  TrackTable: (props: { onPlay: (t: Track, i: number) => void }) => {
    captured.table = props
    return <div data-testid="table" />
  },
}))

describe('AlbumDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    hook.view = 'list'
    hook.notFound = false
    hook.playerState = { currentTrack: null }
  })

  it('shows a not-found state', () => {
    hook.notFound = true
    render(<AlbumDetail />)
    expect(screen.getByText('common.notFound')).toBeInTheDocument()
    expect(screen.queryByTestId('row')).toBeNull()
  })

  it('plays a list row at its absolute index', async () => {
    render(<AlbumDetail />)
    expect(screen.getByTestId('row').dataset.active).toBe('false')
    await captured.row?.onPlay(tracks[0])
    expect(hook.handleTrackPlay).toHaveBeenCalledWith(tracks[0], 40)
  })

  it('marks the current track active', () => {
    hook.playerState = { currentTrack: { id: 't1' } }
    render(<AlbumDetail />)
    expect(screen.getByTestId('row').dataset.active).toBe('true')
  })

  it('plays from the table view', () => {
    hook.view = 'table'
    hook.playerState = { currentTrack: { id: 't1' } }
    render(<AlbumDetail />)
    captured.table?.onPlay(tracks[0], 7)
    expect(hook.handleTrackPlay).toHaveBeenCalledWith(tracks[0], 7)
  })

  it('pages back and forward with a floor of one', () => {
    render(<AlbumDetail />)
    act(() => {
      captured.pagination?.onPrev()
      captured.pagination?.onNext()
    })
    const [prev, next] = hook.setPage.mock.calls.map((c) => (c as unknown as [(p: number) => number])[0])
    expect(prev(1)).toBe(1)
    expect(prev(3)).toBe(2)
    expect(next(3)).toBe(4)
  })
})
