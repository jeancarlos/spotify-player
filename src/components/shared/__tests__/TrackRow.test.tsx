import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrackRow } from '../TrackRow'
import type { SpotifyTrack } from '@/types/spotify'

const track: SpotifyTrack = {
  id: 't1',
  name: 'Test Track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  duration_ms: 212000,
  uri: 'spotify:track:t1',
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [{ url: 'https://img.test/cover.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
  explicit: false,
  popularity: 80,
  preview_url: null,
  type: 'track',
}

describe('TrackRow', () => {
  const onPlay = vi.fn()

  it('renders track name and artist', () => {
    render(<TrackRow track={track} onPlay={onPlay} />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('shows play icon always when no index', () => {
    render(<TrackRow track={track} />)
    const playIcon = document.querySelector('.lucide-play')
    expect(playIcon).toBeInTheDocument()
    expect(screen.queryByText('01')).toBeNull()
  })

  it('shows index number when index prop provided', () => {
    render(<TrackRow track={track} index={0} />)
    expect(screen.getByText('01')).toBeInTheDocument()
  })

  it('calls onPlay when play button is clicked', async () => {
    const user = userEvent.setup()
    render(<TrackRow track={track} onPlay={onPlay} />)
    await user.click(screen.getByRole('button', { name: /player\.playTrack/i }))
    expect(onPlay).toHaveBeenCalledWith(track)
  })

  it('renders trash icon only when onRemove provided', () => {
    const { rerender } = render(<TrackRow track={track} />)
    expect(screen.queryByRole('button', { name: /favorites\.removeConfirm/i })).toBeNull()

    rerender(<TrackRow track={track} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: /favorites\.removeConfirm/i })).toBeInTheDocument()
  })

  it('calls onRemove and not onPlay when trash clicked', async () => {
    const onRemove = vi.fn()
    const onPlay = vi.fn()
    render(<TrackRow track={track} onPlay={onPlay} onRemove={onRemove} />)
    
    const removeBtn = screen.getByRole('button', { name: /favorites\.removeConfirm/i })
    fireEvent.click(removeBtn)
    
    expect(onRemove).toHaveBeenCalledWith('spotify:track:t1')
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('renders note text in DOM when note provided', () => {
    render(<TrackRow track={track} note="This is a note" />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
  })
})
