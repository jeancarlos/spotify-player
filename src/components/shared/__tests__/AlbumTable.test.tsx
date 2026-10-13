import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlbumTable } from '../AlbumTable'
import type { SpotifyAlbumSimple } from '@/types/spotify'

const album: SpotifyAlbumSimple = {
  id: 'alb1',
  name: 'Test Album',
  images: [],
  release_date: '2024-01-01',
  album_type: 'album',
  artists: [],
  uri: 'deezer:album:alb1',
  type: 'album',
}

describe('AlbumTable', () => {
  it('shows the track count column when some album has total_tracks', () => {
    render(<AlbumTable albums={[{ ...album, total_tracks: 12 }, album]} onClick={vi.fn()} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
  })

  it('omits the track count column when no album has total_tracks', () => {
    render(<AlbumTable albums={[album]} onClick={vi.fn()} />)
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
  })

  it('never shows a popularity column', () => {
    render(<AlbumTable albums={[{ ...album, total_tracks: 12 }]} onClick={vi.fn()} />)
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
    expect(screen.queryByText(/pop/i)).not.toBeInTheDocument()
  })
})
