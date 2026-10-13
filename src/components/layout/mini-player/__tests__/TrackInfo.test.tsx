import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TrackInfo } from '../TrackInfo'
import type { SpotifyTrack } from '@/types/spotify'

const track = {
  id: '1',
  uri: 'u1',
  name: 'Song',
  artists: [{ id: 'a', name: 'Artist' }],
  album: { id: 'b', name: 'Album', images: [] },
} as unknown as SpotifyTrack

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: { currentTrack: track } }),
  useProgress: () => ({ progressMs: 12000, durationMs: 30000 }),
}))

function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname + l.search}</output>
}
describe('TrackInfo', () => {
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
    expect(screen.getAllByRole('button', { name: /Song/ })[0]).toHaveFocus()
    await user.tab()
    expect(screen.getAllByRole('button', { name: /Song/ })[1]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('where')).toHaveTextContent('/player?tab=lyrics')
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
})
