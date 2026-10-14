import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrackTable } from '../TrackTable'
import type { AlbumSimple, Track } from '@/types/music'

const album: AlbumSimple = {
  id: 'alb1',
  name: 'Test Album',
  images: [],
  release_date: '2024-01-01',
  album_type: 'album',
  artists: [],
  uri: 'spotify:album:alb1',
  type: 'album',
}
const albumTrack: Track = {
  id: 't1',
  name: 'Album Track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  duration_ms: 212000,
  uri: 'spotify:track:t1',
  explicit: false,
  preview_url: 'https://cdn.test/t1.mp3',
  type: 'track',
  disc_number: 1,
  track_number: 1,
  album,
}

const fullTrack: Track = {
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

  it('disables unplayable rows and only plays playable ones', () => {
    const onPlay = vi.fn()
    const dead = { ...fullTrack, id: 'dead', name: 'Dead Track', is_playable: false }
    render(<TrackTable tracks={[albumTrack, dead]} onPlay={onPlay} />)
    const deadRow = screen.getByText('Dead Track').closest('tr') as HTMLElement
    expect(deadRow).toHaveAttribute('aria-disabled', 'true')
    expect(deadRow.className).toContain('opacity-40')
    expect(screen.getAllByText('track.noPreview')).toHaveLength(1)
    const dis = screen.getAllByRole('button', { name: /player\.playTrack/i, hidden: true })
    expect(dis.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(1)
    fireEvent.click(deadRow)
    expect(onPlay).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Album Track').closest('tr') as HTMLElement)
    expect(onPlay).toHaveBeenCalledWith(albumTrack, 0)
    expect(screen.getByText('Album Track').closest('tr')).not.toHaveAttribute('aria-disabled')
  })

  it('offsets the row numbers when startIndex is given', () => {
    render(<TrackTable tracks={[albumTrack]} startIndex={40} />)
    expect(screen.getByText('41')).toBeInTheDocument()
  })
})
