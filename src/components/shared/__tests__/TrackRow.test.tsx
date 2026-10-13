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
  rank: 80,
  preview_url: 'https://cdn.test/t1.mp3',
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

  it('calls onRemove and not onPlay when trash clicked', () => {
    const onRemove = vi.fn()
    const onPlay = vi.fn()
    render(<TrackRow track={track} onPlay={onPlay} onRemove={onRemove} />)

    const removeBtn = screen.getByRole('button', { name: /favorites\.removeConfirm/i })
    fireEvent.click(removeBtn)

    expect(onRemove).toHaveBeenCalledWith('spotify:track:t1')
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('reveals the note when the row has keyboard focus', async () => {
    render(<TrackRow track={track} onPlay={vi.fn()} note="This is a note" />)
    await userEvent.tab()
    await userEvent.tab()
    const area = screen.getByText('Test Track').closest('[role="button"]')
    expect(area).toHaveFocus()
    expect(area?.className).toContain('group/tipfocus')
    expect(area?.className).toContain('focus-visible:ring-2')
    expect(screen.getByRole('tooltip').className).toContain(
      'group-focus-within/tipfocus:opacity-100'
    )
  })
  it('renders note text in DOM when note provided', () => {
    render(<TrackRow track={track} note="This is a note" />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
  })

  it('disables an unplayable track and never calls onPlay', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    const dead = { ...track, is_playable: false }
    render(<TrackRow track={dead} onPlay={onPlay} index={0} />)
    expect(screen.getByText('track.noPreview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /player\.playTrack/i })).toBeDisabled()
    const row = document.querySelector<HTMLElement>('[aria-disabled="true"]')!
    expect(row).toBeInTheDocument()
    expect(row.parentElement?.className).toContain('opacity-40')
    await user.click(row)
    row.focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: /player\.playTrack/i }))
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('keeps a stored-shape track enabled', () => {
    render(<TrackRow track={{ ...track, is_playable: true, preview_url: null }} onPlay={vi.fn()} />)
    expect(document.querySelector('[aria-disabled="true"]')).toBeNull()
    expect(screen.getByRole('button', { name: /player\.playTrack/i })).toBeEnabled()
  })

  it('flags readable:false tracks as disabled', () => {
    render(<TrackRow track={{ ...track, is_playable: false }} onPlay={vi.fn()} />)
    expect(document.querySelector('[aria-disabled="true"]')).toBeInTheDocument()
  })
})
