import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrackInfoPanel } from '../TrackInfoPanel'
import type { Track } from '@/types/music'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))
const useTrackWikipedia = vi.fn()
vi.mock('@/hooks/queries/useTrackWikipedia', () => ({
  useTrackWikipedia: (a: unknown, b: unknown) => useTrackWikipedia(a, b) as unknown,
}))

const base = {
  id: 't',
  name: 'Song',
  explicit: true,
  duration_ms: 185000,
  artists: [
    { id: 'a1', name: 'One' },
    { id: 'a2', name: 'Two' },
  ],
  album: { name: 'Alb', images: [], release_date: '2020-01-01' },
}

describe('TrackInfoPanel', () => {
  it('renders full details, navigates and shows the wiki block', () => {
    useTrackWikipedia.mockReturnValue({ data: { extract: 'About it', url: 'http://w' } })
    render(<TrackInfoPanel track={base as unknown as Track} />)
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('About it')).toBeInTheDocument()
    expect(screen.getByText('lyrics.releaseDate')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Two'))
    expect(navigate).toHaveBeenCalledWith('/artists/a2')
  })

  it('omits optional parts', () => {
    useTrackWikipedia.mockReturnValue({ data: null })
    const track = {
      ...base,
      explicit: false,
      artists: [],
      album: { ...base.album, release_date: '' },
    }
    render(<TrackInfoPanel track={track as unknown as Track} />)
    expect(screen.queryByText('E')).toBeNull()
    expect(screen.queryByText('lyrics.releaseDate')).toBeNull()
    expect(screen.queryByText('track.aboutTrack')).toBeNull()
  })
})
