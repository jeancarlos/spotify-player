import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrackRow } from '../TrackRow'
import type { Track } from '@/types/music'

const track: Track = {
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

  it('keeps the remove button visible on touch screens and tappable', () => {
    render(<TrackRow track={track} onRemove={vi.fn()} />)
    const remove = screen.getByRole('button', { name: /favorites\.removeConfirm/i })
    expect(remove).toHaveClass('tap-target')
    expect(remove.className).toContain('[@media(hover:hover)]:opacity-0')
    expect(remove.className).not.toMatch(/(^|\s)opacity-0/)
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
    const play = screen.getByRole('button', { name: /player\.playTrack/i })
    expect(play).toHaveFocus()
    expect(play.className).toContain('focus-visible:ring-2')
    expect(play.closest('.group\\/tipfocus')).not.toBeNull()
    expect(screen.getByRole('tooltip').className).toContain(
      'group-focus-within/tipfocus:opacity-100'
    )
  })

  it('takes a single tab stop per row', async () => {
    render(
      <>
        <TrackRow track={track} onPlay={vi.fn()} index={0} />
        <TrackRow track={{ ...track, id: 't2', name: 'Second' }} onPlay={vi.fn()} index={1} />
      </>
    )
    const [first, second] = screen.getAllByRole('button', { name: /player\.playTrack/i })
    await userEvent.tab()
    expect(first).toHaveFocus()
    await userEvent.tab()
    expect(second).toHaveFocus()
  })

  it('plays when the row body is clicked', async () => {
    const onPlay = vi.fn()
    render(<TrackRow track={track} onPlay={onPlay} />)
    await userEvent.click(screen.getByText('Test Track'))
    expect(onPlay).toHaveBeenCalledWith(track)
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
    const row = screen.getByText('Test Track').closest<HTMLElement>('.opacity-40')!
    expect(row).toBeInTheDocument()
    await user.click(screen.getByText('Test Track'))
    await user.tab()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: /player\.playTrack/i }))
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('keeps a stored-shape track enabled', () => {
    render(<TrackRow track={{ ...track, is_playable: true, preview_url: null }} onPlay={vi.fn()} />)
    expect(screen.getByText('Test Track').closest('.opacity-40')).toBeNull()
    expect(screen.getByRole('button', { name: /player\.playTrack/i })).toBeEnabled()
  })

  it('flags readable:false tracks as disabled', () => {
    render(<TrackRow track={{ ...track, is_playable: false }} onPlay={vi.fn()} />)
    expect(screen.getByRole('button', { name: /player\.playTrack/i })).toBeDisabled()
  })
})
