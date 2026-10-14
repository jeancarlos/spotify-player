import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { VinylDisk } from '../VinylDisk'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

describe('VinylDisk arc overlay size', () => {
  afterEach(() => {
    window.innerWidth = 1024
  })

  it('passes the viewport-capped size to the arc overlay', () => {
    window.innerWidth = 400
    const { container } = render(<VinylDisk size="lg" isPlaying={false} favoriteLabel="fav" />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('400')
  })

  it('passes the full size when the viewport is wide enough', () => {
    window.innerWidth = 1024
    const { container } = render(<VinylDisk size="lg" isPlaying={false} favoriteLabel="fav" />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('560')
  })

  it('keeps the arc note still at the top of the disc while it spins or rests', () => {
    for (const isPlaying of [true, false]) {
      const { container, unmount } = render(<VinylDisk size="lg" isPlaying={isPlaying} favoriteLabel="fav" />)
      expect(container.querySelector('svg')?.outerHTML).not.toMatch(/rotate/)
      unmount()
    }
  })
})

describe('VinylDisk props', () => {
  it('renders the album art with a translated alt and a custom class', () => {
    const { container } = render(
      <VinylDisk size="sm" albumArt="a.jpg" albumName="Abbey" className="extra" />
    )
    expect(container.firstElementChild?.className).toContain('extra')
    const art = container.querySelectorAll('img')[1]
    expect(art.getAttribute('src')).toBe('a.jpg')
    expect(art.getAttribute('alt')).toBe('favorites.album: Abbey')
  })

  it('falls back to the label svg and skips the overlay on the xs size', () => {
    const { container } = render(<VinylDisk size="xs" favoriteLabel="fav" />)
    expect(container.querySelectorAll('img')[1].getAttribute('src')).toBe('/vinyla-label.svg')
    expect(container.querySelector('svg')).toBeNull()
  })
})
