import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerContext } from '@/contexts/PlayerContext'
import { PlayerQueue } from '../PlayerQueue'
import type { SpotifyTrack } from '@/types/spotify'

const mk = (id: string): SpotifyTrack => ({
  id,
  name: `Name ${id}`,
  artists: [{ id: 'a1', name: 'Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  duration_ms: 1000,
  uri: `spotify:track:${id}`,
  album: {
    id: 'alb',
    name: 'Album',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb',
    type: 'album',
  },
  explicit: false,
  rank: 1,
  preview_url: 'https://cdn.test/x.mp3',
  type: 'track',
})

const [A, B, C] = [mk('A'), mk('B'), mk('C')]

function renderQueue(queue: SpotifyTrack[], queueIndex: number) {
  const playTrack = vi.fn()
  const value = {
    state: { currentTrack: queue[queueIndex] ?? null, queue, queueIndex, isPlaying: true },
    dispatch: vi.fn(),
    controls: { playTrack },
  } as never
  render(
    <PlayerContext.Provider value={value}>
      <PlayerQueue />
    </PlayerContext.Provider>
  )
  return playTrack
}

describe('PlayerQueue', () => {
  it('renders only tracks after queueIndex, in order', () => {
    renderQueue([A, B, C], 0)
    const names = screen.getAllByText(/^Name /).map((e) => e.textContent)
    expect(names).toEqual(['Name B', 'Name C'])
  })

  it('keeps duplicates', () => {
    renderQueue([A, B, A, B], 0)
    expect(screen.getAllByText('Name B')).toHaveLength(2)
    expect(screen.getAllByText('Name A')).toHaveLength(1)
  })

  it('keeps [B, A, B] after the current track', () => {
    renderQueue([C, B, A, B], 0)
    expect(screen.getAllByText(/^Name /).map((e) => e.textContent)).toEqual([
      'Name B',
      'Name A',
      'Name B',
    ])
  })

  it('plays the clicked track within the queue', async () => {
    const queue = [A, B, C]
    const playTrack = renderQueue(queue, 0)
    await userEvent.click(screen.getByText('Name C'))
    expect(playTrack).toHaveBeenCalledWith(C, queue)
  })

  it('shows the empty state when nothing is upcoming', () => {
    renderQueue([A], 0)
    expect(screen.queryByText(/^Name /)).toBeNull()
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
