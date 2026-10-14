import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PlayerProvider, usePlayer, useProgress, type PlayerControls } from '../PlayerContext'
import { deezer } from '@/lib/deezer'
import { readRecent } from '@/utils/recentStorage'
import type { Track } from '@/types/music'

vi.mock('@/lib/deezer', () => ({ deezer: vi.fn() }))
vi.mock('@/lib/deezerMappers', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toTrack: (raw: Track) => raw,
}))

const deezerMock = vi.mocked(deezer)

function track(id: string, playable = true): Track {
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

const fresh = (t: Track): Track => ({ ...t, preview_url: `https://fresh.test/${t.id}.mp3` })

describe('PlayerProvider', () => {
  let play: ReturnType<typeof vi.spyOn>
  let pause: ReturnType<typeof vi.spyOn>
  let actions: Partial<Record<MediaSessionAction, () => void>>

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('pause'))
    })
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    actions = {}
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: {
        metadata: null,
        setActionHandler: (action: MediaSessionAction, handler: (() => void) | null) => {
          actions[action] = handler ?? undefined
        },
      },
    })
    vi.stubGlobal(
      'MediaMetadata',
      vi.fn(function (this: object, init: MediaMetadataInit) {
        Object.assign(this, init)
      })
    )
    deezerMock.mockImplementation((path: string) => Promise.resolve(fresh(track(path.split('/')[1]))))
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'mediaSession')
    deezerMock.mockReset()
    localStorage.clear()
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

  it('starts at the given index when the track is queued twice', async () => {
    const list = [track('1'), track('2'), track('1')]
    await act(() => controls.playTrack(list[2], list, 2))
    expect(latest.queueIndex).toBe(2)
    await act(() => controls.playTrack(list[2], list, 1))
    expect(latest.queueIndex).toBe(0)
  })

  it('refetches the preview at the paused position when resuming fails', async () => {
    await act(() => controls.playTrack(track('1')))
    act(() => {
      controls.toggle()
    })
    audio().currentTime = 12
    deezerMock.mockClear()
    play.mockImplementationOnce(() => Promise.reject(new DOMException('expired', 'NotSupportedError')))
    await act(async () => {
      controls.toggle()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.isPlaying).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('track/1')
    expect(audio().currentTime).toBe(12)
  })

  it('does not refetch when the browser blocks playback', async () => {
    await act(() => controls.playTrack(track('1')))
    act(() => {
      controls.toggle()
    })
    deezerMock.mockClear()
    play.mockImplementationOnce(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')))
    await act(async () => {
      controls.toggle()
      await Promise.resolve()
    })
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('keeps the paused position when the resume refetch fails', async () => {
    await act(() => controls.playTrack(track('1')))
    act(() => {
      controls.toggle()
    })
    audio().currentTime = 12
    deezerMock.mockRejectedValueOnce(new Error('offline'))
    play.mockImplementationOnce(() => Promise.reject(new DOMException('expired', 'NotSupportedError')))
    await act(async () => {
      controls.toggle()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.isLoading).toBe(false)
    })
    expect(audio().getAttribute('src')).toBeNull()
    await act(async () => {
      controls.toggle()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.isPlaying).toBe(true)
    })
    expect(audio().currentTime).toBe(12)
  })

  it('does not refetch when a resume is aborted', async () => {
    await act(() => controls.playTrack(track('1')))
    act(() => {
      controls.toggle()
    })
    deezerMock.mockClear()
    play.mockImplementationOnce(() => Promise.reject(new DOMException('aborted', 'AbortError')))
    await act(async () => {
      controls.toggle()
      await Promise.resolve()
    })
    expect(deezerMock).not.toHaveBeenCalled()
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
    let releaseFirst: (t: Track) => void = () => undefined
    deezerMock.mockImplementationOnce(
      () =>
        new Promise<Track>((resolve) => {
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
    deezerMock.mockClear()
    act(() => {
      controls.seek(20000)
    })
    expect(el.currentTime).toBe(20)
    expect(deezerMock).not.toHaveBeenCalled()
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

  it('records a successful play in recently played without the preview url', async () => {
    await act(() => controls.playTrack(track('7')))
    expect(readRecent()[0]).toMatchObject({ id: '7', preview_url: null })
  })

  it('does not record a play the browser blocked', async () => {
    play.mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'))
    await act(() => controls.playTrack(track('8')))
    expect(readRecent().some((t) => t.id === '8')).toBe(false)
  })

  it('pauses the current audio when switching tracks', async () => {
    await act(() => controls.playTrack(track('1')))
    pause.mockClear()
    await act(() => controls.playTrack(track('2')))
    expect(pause).toHaveBeenCalled()
  })

  it('setShuffle updates the ref before the next read', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const list = [track('1'), track('2'), track('3')]
    await act(() => controls.playTrack(list[0], list))
    await act(async () => {
      controls.setShuffle(true)
      controls.next()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('3')
    })
  })

  it('ignores playTrack for an unplayable track', async () => {
    const list = [track('1'), track('2')]
    deezerMock.mockImplementation((path: string) => Promise.resolve(fresh(list[Number(path.slice(-1)) - 1])))
    await act(() => controls.playTrack(list[0], list))
    const src = audio().src
    deezerMock.mockClear()
    await act(() => controls.playTrack(track('9', false), [track('9', false)]))
    expect(latest.currentTrack?.id).toBe('1')
    expect(latest.queue).toEqual(list)
    expect(audio().src).toBe(src)
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('plays a stored-shape track that has no preview url', async () => {
    const stored = { ...track('5'), is_playable: true, preview_url: null }
    deezerMock.mockResolvedValue(fresh(stored))
    await act(() => controls.playTrack(stored))
    expect(deezerMock).toHaveBeenCalledWith('track/5')
    expect(audio().src).toBe('https://fresh.test/5.mp3')
    expect(latest.currentTrack?.id).toBe('5')
  })
  it('clears the old source and shows paused while the next track loads', async () => {
    await act(() => controls.playTrack(track('1')))
    let release: (t: Track) => void = () => undefined
    deezerMock.mockImplementationOnce(
      () =>
        new Promise<Track>((resolve) => {
          release = resolve
        })
    )
    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = controls.playTrack(track('2'))
    })
    expect(audio().getAttribute('src')).toBeNull()
    expect(latest.isPlaying).toBe(false)
    expect(latest.isLoading).toBe(true)
    play.mockClear()
    act(() => {
      controls.toggle()
    })
    expect(play).not.toHaveBeenCalled()
    await act(async () => {
      release(fresh(track('2')))
      await pending
    })
    expect(audio().src).toBe('https://fresh.test/2.mp3')
    expect(latest.isPlaying).toBe(true)
  })

  it('retries the failed track instead of resuming the previous one', async () => {
    await act(() => controls.playTrack(track('1')))
    deezerMock.mockRejectedValueOnce(new Error('timeout'))
    await act(() => controls.playTrack(track('2')))
    expect(latest.currentTrack?.id).toBe('2')
    expect(latest.isPlaying).toBe(false)
    expect(audio().getAttribute('src')).toBeNull()
    await act(async () => {
      controls.toggle()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(audio().src).toBe('https://fresh.test/2.mp3')
    })
    expect(latest.isPlaying).toBe(true)
  })

  it('follows play, pause and error events from the element', async () => {
    await act(() => controls.playTrack(track('1')))
    expect(latest.isPlaying).toBe(true)
    act(() => {
      fireEvent(audio(), new Event('pause'))
    })
    expect(latest.isPlaying).toBe(false)
    act(() => {
      fireEvent(audio(), new Event('play'))
    })
    expect(latest.isPlaying).toBe(true)
    act(() => {
      fireEvent(audio(), new Event('error'))
    })
    expect(latest.isPlaying).toBe(false)
  })

  it('publishes media session metadata and handles media keys', async () => {
    const first = track('1')
    const list = [{ ...first, album: { ...first.album, images: [{ url: 'https://img.test/1.jpg', width: 500, height: 500 }] } }, track('2')]
    await act(() => controls.playTrack(list[0], list))
    expect(navigator.mediaSession.metadata).toMatchObject({
      title: 'Track 1',
      artist: 'Artist',
      album: 'Album',
      artwork: [{ src: 'https://img.test/1.jpg' }],
    })
    act(() => {
      actions.pause?.()
    })
    expect(latest.isPlaying).toBe(false)
    play.mockClear()
    act(() => {
      actions.play?.()
    })
    expect(play).toHaveBeenCalled()
    await act(async () => {
      actions.nexttrack?.()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('2')
    })
    expect(actions.previoustrack).toBeDefined()
  })

  it('clamps seek to the preview length', async () => {
    await act(() => controls.playTrack(track('1')))
    Object.defineProperty(audio(), 'duration', { configurable: true, value: 30 })
    act(() => {
      controls.seek(45000)
    })
    expect(audio().currentTime).toBe(30)
    act(() => {
      controls.seek(-1000)
    })
    expect(audio().currentTime).toBe(0)
  })
})
