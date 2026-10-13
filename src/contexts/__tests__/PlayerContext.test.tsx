import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PlayerProvider, usePlayer, useProgress, type PlayerControls } from '../PlayerContext'
import { deezer } from '@/lib/deezer'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/lib/deezer', () => ({ deezer: vi.fn() }))
vi.mock('@/lib/deezerMappers', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toTrack: (raw: SpotifyTrack) => raw,
}))

const deezerMock = vi.mocked(deezer)

function track(id: string, playable = true): SpotifyTrack {
  return {
    id,
    uri: `deezer:track:${id}`,
    name: `Track ${id}`,
    type: 'track',
    explicit: false,
    duration_ms: 200000,
    is_playable: playable,
    preview_url: playable ? `https://cdn.test/${id}.mp3` : null,
    artists: [{ id: 'a', uri: 'deezer:artist:a', name: 'Artist', type: 'artist' }],
    album: {
      id: 'al',
      uri: 'deezer:album:al',
      name: 'Album',
      type: 'album',
      album_type: 'album',
      images: [],
      release_date: '2020-01-01',
      artists: [],
    },
  }
}

let controls: PlayerControls
let latest: ReturnType<typeof usePlayer>['state']

function Probe() {
  const player = usePlayer()
  const { progressMs } = useProgress()
  useEffect(() => {
    controls = player.controls
    latest = player.state
  })
  return <span data-testid="progress">{Math.round(progressMs)}</span>
}

function audio(): HTMLAudioElement {
  return screen.getByTestId('player-audio')
}

const fresh = (t: SpotifyTrack): SpotifyTrack => ({ ...t, preview_url: `https://fresh.test/${t.id}.mp3` })

describe('PlayerProvider', () => {
  let play: ReturnType<typeof vi.spyOn>
  let pause: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    deezerMock.mockImplementation((path: string) => Promise.resolve(fresh(track(path.split('/')[1]))))
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    deezerMock.mockReset()
  })

  it('fetches a fresh preview before playing', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(list[0], list))
    expect(deezerMock).toHaveBeenCalledWith('track/1')
    expect(audio().src).toBe('https://fresh.test/1.mp3')
    expect(play).toHaveBeenCalled()
    expect(latest.isPlaying).toBe(true)
    expect(latest.queue).toEqual(list)
    expect(latest.queueIndex).toBe(0)
  })

  it('advances on ended and skips unplayable tracks', async () => {
    const list = [track('1'), track('2', false), track('3')]
    await act(() => controls.playTrack(list[0], list))
    await act(() => {
      fireEvent(audio(), new Event('ended'))
      return Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('3')
    })
    expect(latest.queueIndex).toBe(2)
  })

  it('stops at the end of the queue when repeat is off', async () => {
    const list = [track('1')]
    await act(() => controls.playTrack(list[0], list))
    await act(() => {
      fireEvent(audio(), new Event('ended'))
      return Promise.resolve()
    })
    expect(pause).toHaveBeenCalled()
    expect(latest.isPlaying).toBe(false)
  })

  it('wraps to the first playable track when repeat is context', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(list[1], list))
    act(() => {
      controls.cycleRepeat()
    })
    expect(latest.repeat).toBe('context')
    await act(() => {
      fireEvent(audio(), new Event('ended'))
      return Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('1')
    })
  })

  it('replays the same track when repeat is track', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(list[0], list))
    act(() => {
      controls.cycleRepeat()
      controls.cycleRepeat()
    })
    expect(latest.repeat).toBe('track')
    deezerMock.mockClear()
    play.mockClear()
    await act(() => {
      fireEvent(audio(), new Event('ended'))
      return Promise.resolve()
    })
    expect(play).toHaveBeenCalledTimes(1)
    expect(deezerMock).not.toHaveBeenCalled()
    expect(latest.currentTrack?.id).toBe('1')
  })

  it('keeps only the latest track when plays overlap', async () => {
    let releaseFirst: (t: SpotifyTrack) => void = () => undefined
    deezerMock.mockImplementationOnce(
      () =>
        new Promise<SpotifyTrack>((resolve) => {
          releaseFirst = resolve
        })
    )
    await act(async () => {
      const first = controls.playTrack(track('1'))
      await controls.playTrack(track('2'))
      releaseFirst(fresh(track('1')))
      await first
    })
    expect(latest.currentTrack?.id).toBe('2')
    expect(audio().src).toBe('https://fresh.test/2.mp3')
    expect(latest.isPlaying).toBe(true)
  })

  it('reports not playing when the browser blocks play()', async () => {
    play.mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'))
    await act(() => controls.playTrack(track('1')))
    expect(latest.isPlaying).toBe(false)
    expect(latest.isLoading).toBe(false)
  })

  it('publishes progress from timeupdate and seeks locally', async () => {
    await act(() => controls.playTrack(track('1')))
    const el = audio()
    el.currentTime = 12.5
    act(() => {
      fireEvent(el, new Event('timeupdate'))
    })
    expect(screen.getByTestId('progress').textContent).toBe('12500')
    act(() => {
      controls.seek(20000)
    })
    expect(el.currentTime).toBe(20)
    expect(screen.getByTestId('progress').textContent).toBe('20000')
  })

  it('restarts the track on previous after 3 seconds, otherwise goes back', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(list[1], list))
    audio().currentTime = 5
    act(() => {
      controls.previous()
    })
    expect(audio().currentTime).toBe(0)
    expect(latest.currentTrack?.id).toBe('2')
    act(() => {
      controls.previous()
    })
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('1')
    })
  })
})
