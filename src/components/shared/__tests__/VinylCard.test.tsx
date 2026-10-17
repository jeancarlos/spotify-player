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

  it('shows the active state and sound bars', () => {
    const { container } = render(
      <VinylCard track={track({ is_playable: true })} isActive size="sm" onPlay={vi.fn()} />
    )
    expect(container.querySelectorAll('span.bg-primary')).toHaveLength(3)
    expect(screen.getByRole('button')).toHaveStyle({ width: '100px' })
  })

  it('plays with Enter and Space and ignores other keys', () => {
    const onPlay = vi.fn()
    render(<VinylCard track={track()} onPlay={onPlay} />)
    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })
    fireEvent.keyDown(card, { key: ' ' })
    fireEvent.keyDown(card, { key: 'a' })
    expect(onPlay).toHaveBeenCalledTimes(2)
  })

  it('renders without album art', () => {
    render(<VinylCard track={track({ album: { name: 'Al', images: [] } as never })} />)
    expect(screen.getByRole('button').querySelector('img')).toHaveAttribute('alt', '')
  })
})
