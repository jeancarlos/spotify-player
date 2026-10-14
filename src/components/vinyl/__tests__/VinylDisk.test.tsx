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
})
