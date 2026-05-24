import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TrackRow } from '../TrackRow'
import type { SpotifyTrack } from '@/types/spotify'

const track: SpotifyTrack = {
  id: 't1',
  uri: 'spotify:track:t1',
  name: 'Test Track',
  duration_ms: 212000,
  explicit: false,
  popularity: 80,
  artists: [
    {
      id: 'a1',
      name: 'Test Artist',
      uri: 'spotify:artist:a1',
      href: '',
      type: 'artist',
      external_urls: { spotify: '' },
    },
  ],
  album: {
    id: 'al1',
    name: 'Test Album',
    uri: 'spotify:album:al1',
    href: '',
    album_type: 'album',
    release_date: '2024-01-01',
    images: [{ url: 'https://img.test/cover.jpg', width: 300, height: 300 }],
    artists: [],
    external_urls: { spotify: '' },
    type: 'album',
    total_tracks: 10,
  },
  href: '',
  type: 'track',
  external_urls: { spotify: '' },
  preview_url: null,
}

describe('TrackRow', () => {
  it('renders track name and artist', () => {
    render(<TrackRow track={track} />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('shows play icon always when no index', () => {
    render(<TrackRow track={track} />)
    expect(screen.getByRole('button', { name: /player\.playTrack/i })).toBeInTheDocument()
  })

  it('shows index number when index prop provided', () => {
    render(<TrackRow track={track} index={2} />)
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('calls onPlay when play button is clicked', async () => {
    const onPlay = vi.fn()
    render(<TrackRow track={track} onPlay={onPlay} />)
    await userEvent.click(screen.getByRole('button', { name: /player\.playTrack/i }))
    expect(onPlay).toHaveBeenCalledWith(track)
  })

  it('renders trash icon only when onRemove provided', () => {
    const { rerender } = render(<TrackRow track={track} />)
    expect(screen.queryByRole('button', { name: /favorites\.removeConfirm/i })).toBeNull()

    rerender(<TrackRow track={track} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: /favorites\.removeConfirm/i })).toBeInTheDocument()
  })

  it('calls onRemove and not onPlay when trash clicked', async () => {
    const onPlay = vi.fn()
    const onRemove = vi.fn()
    render(<TrackRow track={track} onPlay={onPlay} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: /favorites\.removeConfirm/i }))
    expect(onRemove).toHaveBeenCalledWith('spotify:track:t1')
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('renders note text in DOM when note provided', () => {
    render(<TrackRow track={track} note="great song" />)
    expect(screen.getByText('great song')).toBeInTheDocument()
  })
})
