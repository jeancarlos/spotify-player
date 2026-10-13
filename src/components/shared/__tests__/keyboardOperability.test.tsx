import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumTable } from '../AlbumTable'
import { TrackTable } from '../TrackTable'
import { VinylCard } from '../VinylCard'
import { TiltCover } from '../TiltCover'
import { LyricsView } from '@/components/layout/LyricsView'
import { ArtistTopTracksChart } from '@/components/artist/ArtistTopTracksChart'
vi.mock('recharts', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  ResponsiveContainer: () => null,
}))

import type { SpotifyAlbumSimple, SpotifyTrack } from '@/types/spotify'

const album = {
  id: 'alb1',
  name: 'Album One',
  images: [],
  release_date: '2024-01-01',
  album_type: 'album',
  artists: [],
} as unknown as SpotifyAlbumSimple

const track = (id: string, extra: Partial<SpotifyTrack> = {}) =>
  ({
    id,
    name: `Song ${id}`,
    rank: 100,
    artists: [{ id: 'a', name: 'A' }],
    album: { id: 'al', name: 'Al', images: [{ url: 'u' }] },
    ...extra,
  }) as unknown as SpotifyTrack

describe('keyboard operability', () => {
  it('AlbumTable opens an album from a real button with Enter and Space', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<AlbumTable albums={[album]} onClick={onClick} />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Album One' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('AlbumTable row click still opens the album once', async () => {
    const onClick = vi.fn()
    render(<AlbumTable albums={[album]} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Album One' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('TrackTable play button is reachable by Tab, revealed on focus, and plays with Enter and Space', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    render(<TrackTable tracks={[track('1')]} onPlay={onPlay} />)
    await user.tab()
    const play = screen.getByRole('button', { name: 'player.playTrack' })
    expect(play).toHaveFocus()
    expect(play).not.toHaveClass('hidden')
    expect(play.className).toContain('group-focus-within:not-sr-only')
    expect(play.className).toContain('focus-visible:ring-2')
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onPlay).toHaveBeenCalledTimes(2)
  })

  it('TrackTable keeps an unplayable row disabled and out of the tab order', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    render(<TrackTable tracks={[track('1', { is_playable: false })]} onPlay={onPlay} />)
    expect(screen.getByRole('button', { name: 'player.playTrack' })).toBeDisabled()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('VinylCard plays on Enter and Space and prevents the Space scroll', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    render(<VinylCard track={track('1', { is_playable: true })} onPlay={onPlay} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onPlay).toHaveBeenCalledTimes(2)
    const card = screen.getByRole('button')
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    card.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })

  it('VinylCard unplayable ignores Enter and Space', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    render(<VinylCard track={track('1', { is_playable: false })} onPlay={onPlay} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('TiltCover activates on Enter and Space and prevents the Space scroll', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('PointerEvent', MouseEvent)
    const onClick = vi.fn()
    render(<TiltCover size={100} name="c" onClick={onClick} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    screen.getByRole('button').dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    vi.unstubAllGlobals()
  })

  it('LyricsView lines are buttons that seek with Enter and Space', async () => {
    const user = userEvent.setup()
    const onSeek = vi.fn()
    render(
      <LyricsView
        lines={[
          { time: 0, text: 'Primeira' },
          { time: 5000, text: 'Segunda' },
        ]}
        progress={0}
        onSeek={onSeek}
      />
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'Primeira' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.tab()
    await user.keyboard(' ')
    expect(onSeek).toHaveBeenNthCalledWith(1, 0)
    expect(onSeek).toHaveBeenNthCalledWith(2, 5000)
  })

  it('LyricsView without onSeek renders no buttons', () => {
    render(<LyricsView lines={[{ time: 0, text: 'Primeira' }]} progress={0} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('the artist chart has a keyboard path that plays playable bars only', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    render(
      <ArtistTopTracksChart
        tracks={[track('1', { rank: 900 }), track('2', { rank: 500, is_playable: false })]}
        onPlay={onPlay}
      />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[1]).toBeDisabled()
    await user.tab()
    expect(buttons[0]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPlay.mock.calls[0][0].id).toBe('1')
  })
})
