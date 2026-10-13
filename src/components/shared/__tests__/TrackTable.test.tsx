import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrackTable } from '../TrackTable'
import type { SpotifyAlbumSimple, SpotifyTrack } from '@/types/spotify'

const album: SpotifyAlbumSimple = {
  id: 'alb1',
  name: 'Test Album',
  images: [],
  release_date: '2024-01-01',
  album_type: 'album',
  artists: [],
  uri: 'spotify:album:alb1',
  type: 'album',
}
const albumTrack: SpotifyTrack = {
  id: 't1',
  name: 'Album Track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  duration_ms: 212000,
  uri: 'spotify:track:t1',
  explicit: false,
  preview_url: null,
  type: 'track',
  disc_number: 1,
  track_number: 1,
  album,
}

const fullTrack: SpotifyTrack = {
  ...albumTrack,
  id: 't2',
  name: 'Full Track',
  rank: 73,
}

describe('TrackTable', () => {
  it('omits the rank column when no track has rank', () => {
    render(<TrackTable tracks={[albumTrack]} showAlbumColumn={false} />)
    const withoutData = screen.getAllByRole('columnheader').length
    render(<TrackTable tracks={[fullTrack]} showAlbumColumn={false} />)
    expect(screen.getAllByRole('columnheader').length).toBe(withoutData * 2 + 1)
    expect(screen.getByText('73')).toBeInTheDocument()
  })
})
