import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TrackInfo } from '../TrackInfo'
import type { Track } from '@/types/music'

const baseTrack = {
  id: '1',
  uri: 'u1',
  name: 'Song',
  artists: [{ id: 'a', name: 'Artist' }],
  album: { id: 'b', name: 'Album', images: [] },
} as unknown as Track
let current: Track | null = baseTrack

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: { currentTrack: current } }),
  useProgress: () => ({ progressMs: 12000, durationMs: 30000 }),
}))

function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname + l.search}</output>
}
describe('TrackInfo', () => {
  beforeEach(() => {
    current = baseTrack
  })
  it('has no fake role=button wrapper and opens the lyrics once from the keyboard', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <TrackInfo notes={{}} />
        <Where />
      </MemoryRouter>
    )
    expect(container.querySelector('div[role="button"]')).toBeNull()
    await user.tab()
    const title = screen.getByRole('button', { name: /Song/ })
    expect(title).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('where')).toHaveTextContent('/player?tab=lyrics')
  })
  it('makes the note button focusable and reveals its text on focus', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <TrackInfo notes={{ u1: 'my note' }} />
      </MemoryRouter>
    )
    const note = screen.getByRole('button', { name: 'my note' })
    expect(note).not.toHaveAttribute('tabindex')
    await user.tab()
    expect(note).toHaveFocus()
    expect(screen.getByText('my note', { selector: 'span' })).toHaveAttribute('aria-hidden', 'true')
    expect(note.className).toContain('focus-visible:ring-2')
    expect(screen.getByText('my note', { selector: 'span' }).className).toContain(
      'group-focus-within/note:opacity-100'
    )
  })
  it('opens the lyrics with Space on the title button', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <TrackInfo notes={{}} />
        <Where />
      </MemoryRouter>
    )
    await user.tab()
    await user.keyboard(' ')
    expect(screen.getByTestId('where')).toHaveTextContent('/player?tab=lyrics')
  })

  it('shows the track and the useProgress times', () => {
    render(
      <MemoryRouter>
        <TrackInfo notes={{}} />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Song').length).toBeGreaterThan(0)
    expect(screen.getByText('0:12')).toBeInTheDocument()
    expect(screen.getByText('0:30')).toBeInTheDocument()
  })
  it('has a single tab stop for the track', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <TrackInfo notes={{}} />
      </MemoryRouter>
    )
    await user.tab()
    const title = screen.getByRole('button', { name: /Song/ })
    expect(title).toHaveFocus()
    await user.tab()
    expect(title).not.toHaveFocus()
    expect(document.querySelectorAll('button[aria-hidden="true"]')[0]).toHaveAttribute(
      'tabindex',
      '-1'
    )
  })

  it('shows the empty state without a track', () => {
    current = null
    render(
      <MemoryRouter>
        <TrackInfo notes={{}} />
      </MemoryRouter>
    )
    expect(screen.getByText('player.noTrack')).toBeInTheDocument()
  })

  it('goes back to the origin from the player page', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/player', state: { from: '/favorites' } }]}>
        <TrackInfo notes={{}} />
        <Where />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /Song/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('/favorites')
  })

  it('navigates to every artist and to the album', async () => {
    current = {
      ...baseTrack,
      artists: [
        { id: 'a', name: 'Artist' },
        { id: 'c', name: 'Other' },
      ],
    } as unknown as Track
    render(
      <MemoryRouter initialEntries={['/']}>
        <TrackInfo notes={{}} />
        <Where />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /Other/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('/artists/c')
    await userEvent.click(screen.getByRole('button', { name: 'Album' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/albums/b')
  })

  it('uses the album image as the cover', () => {
    current = {
      ...baseTrack,
      album: { id: 'b', name: 'Album', images: [{ url: 'https://img.test/c.jpg', width: 96, height: 96 }] },
    } as unknown as Track
    const { container } = render(
      <MemoryRouter>
        <TrackInfo notes={{}} />
      </MemoryRouter>
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://img.test/c.jpg')
  })
})
