import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VinylCard } from '../VinylCard'
import type { Track } from '@/types/music'

const track = (extra: Partial<Track> = {}) =>
  ({
    id: 't',
    name: 'Song',
    artists: [{ id: 'a', name: 'A' }],
    album: { name: 'Al', images: [{ url: 'u' }] },
    ...extra,
  }) as unknown as Track

describe('VinylCard', () => {
  it('disables an unplayable vinyl and ignores clicks', () => {
    const onPlay = vi.fn()
    render(<VinylCard track={track({ is_playable: false })} onPlay={onPlay} />)
    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('track.noPreview')).toBeInTheDocument()
    fireEvent.click(card)
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('plays a playable vinyl', () => {
    const onPlay = vi.fn()
    render(<VinylCard track={track({ is_playable: true, preview_url: null })} onPlay={onPlay} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onPlay).toHaveBeenCalledTimes(1)
  })
})
