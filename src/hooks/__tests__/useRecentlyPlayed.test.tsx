import { describe, it, expect, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useRecentlyPlayed } from '../useRecentlyPlayed'
import { pushRecent } from '@/utils/recentStorage'
import type { Track } from '@/types/music'

const track = {
  uri: 'deezer:track:1',
  id: '1',
  name: 'Track',
  type: 'track',
  explicit: false,
  is_playable: true,
  preview_url: null,
  duration_ms: 180000,
  artists: [],
  album: { uri: 'deezer:album:1', id: '1', name: 'Album', type: 'album', images: [] },
} as unknown as Track

function List({ limit }: { limit: number }) {
  const { data } = useRecentlyPlayed(limit)
  return <div data-testid="recent-list">{data.map((t) => t.id).join(',')}</div>
}

const push = (id: string) => { pushRecent({ ...track, id, uri: `deezer:track:${id}` }); }

describe('useRecentlyPlayed', () => {
  beforeEach(() => { localStorage.clear(); })

  it('reads initial recent tracks', () => {
    push('1')
    render(<List limit={10} />)
    expect(screen.getByTestId('recent-list').textContent).toBe('1')
  })

  it('respects limit', () => {
    for (let i = 0; i < 10; i++) push(String(i))
    render(<List limit={5} />)
    expect(screen.getByTestId('recent-list').textContent).toBe('9,8,7,6,5')
  })

  it('updates on spoter:recent-changed', () => {
    render(<List limit={10} />)
    expect(screen.getByTestId('recent-list').textContent).toBe('')
    act(() => { push('3'); })
    expect(screen.getByTestId('recent-list').textContent).toBe('3')
  })

  it('refreshes on a storage event without a key and ignores other keys', () => {
    render(<List limit={10} />)
    localStorage.setItem('spoter_recent_v1', JSON.stringify([{ ...track, id: '6' }]))
    fireEvent(window, new StorageEvent('storage', { key: 'other' }))
    expect(screen.getByTestId('recent-list').textContent).toBe('')
    fireEvent(window, new StorageEvent('storage', { key: null }))
    expect(screen.getByTestId('recent-list').textContent).toBe('6')
  })

  it('updates on storage event', () => {
    render(<List limit={10} />)
    localStorage.setItem('spoter_recent_v1', JSON.stringify([{ ...track, id: '5' }]))
    fireEvent(window, new StorageEvent('storage', { key: 'spoter_recent_v1' }))
    expect(screen.getByTestId('recent-list').textContent).toBe('5')
  })
})
