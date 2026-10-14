import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PersistentVinylDisk } from '../PersistentVinylDisk'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

let mockTrack: unknown = null
let mockFavorites: { tracks: { uri: string }[]; notes: Record<string, string> }

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: { currentTrack: mockTrack, isPlaying: true } }),
}))
vi.mock('@/hooks/useFavorites', () => ({ useFavorites: () => mockFavorites }))
vi.mock('@/hooks/useWindowSize', () => ({ useWindowSize: () => ({ width: 1000, height: 900 }) }))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ animate, children }: { animate: unknown; children: React.ReactNode }) => (
      <div data-testid="m" data-animate={JSON.stringify(animate)}>
        {children}
      </div>
    ),
    img: () => <img alt="" />,
  },
}))

const track = (images: { url: string }[]) => ({
  uri: 'u1',
  album: { name: 'Alb', images },
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PersistentVinylDisk />
    </MemoryRouter>
  )

describe('PersistentVinylDisk', () => {
  beforeEach(() => {
    mockTrack = null
    mockFavorites = { tracks: [], notes: {} }
  })

  it('renders without a track and animates scale on the home route', () => {
    const { getByTestId, container } = renderAt('/')
    const animate = JSON.parse(getByTestId('m').dataset.animate!)
    expect(animate.scale).toBeLessThanOrEqual(1)
    expect(container.querySelectorAll('img')).toHaveLength(2)
  })

  it('offsets by the player clearance and unit scale on other routes', () => {
    const { getByTestId } = renderAt('/favorites')
    expect(JSON.parse(getByTestId('m').dataset.animate!)).toEqual({ y: 584, scale: 1 })
  })

  it('shows the favorite note on the arc when the track is a favorite', () => {
    mockTrack = track([{ url: 'a.jpg' }])
    mockFavorites = { tracks: [{ uri: 'u1' }], notes: { u1: 'note' } }
    const { container } = renderAt('/')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('omits the note when the track is not a favorite or has no cover', () => {
    mockTrack = track([])
    mockFavorites = { tracks: [], notes: { u1: 'note' } }
    const { container } = renderAt('/')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('omits the note when a favorite has none', () => {
    mockTrack = track([{ url: 'a.jpg' }])
    mockFavorites = { tracks: [{ uri: 'u1' }], notes: {} }
    const { container } = renderAt('/')
    expect(container.querySelector('svg')).toBeNull()
  })
})
