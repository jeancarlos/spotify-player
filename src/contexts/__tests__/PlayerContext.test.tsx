import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  const { progressMs, durationMs } = useProgress()
  useEffect(() => {
    controls = player.controls
    latest = player.state
  })
  return (
    <span data-testid="progress" data-duration={durationMs}>
      {Math.round(progressMs)}
    </span>
  )
}

function audio(): HTMLAudioElement {
  return screen.getByTestId('player-audio')
}

const fresh = (t: Track): Track => ({ ...t, preview_url: `https://fresh.test/${t.id}.mp3` })

const ended = () =>
  act(() => {
    fireEvent(audio(), new Event('ended'))
    return Promise.resolve()
  })

const playLastOfTwo = async () => {
  const list = [track('1'), track('2')]
  await act(() => controls.playTrack(list[1], list))
}

const toggleAsync = () =>
  act(async () => {
    controls.toggle()
    await Promise.resolve()
  })

const playThenPause = async (id = '1') => {
  await act(() => controls.playTrack(track(id)))
  act(() => {
    controls.toggle()
  })
}

describe('PlayerProvider', () => {
  let play: ReturnType<typeof vi.spyOn>
  let pause: ReturnType<typeof vi.spyOn>
  let actions: Partial<Record<MediaSessionAction, () => void>>

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
      this: HTMLMediaElement
    ) {
      this.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
      this: HTMLMediaElement
    ) {
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
    deezerMock.mockImplementation((path: string) =>
      Promise.resolve(fresh(track(path.split('/')[1])))
    )
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
    await playThenPause()
    audio().currentTime = 12
    deezerMock.mockClear()
    play.mockImplementationOnce(() =>
      Promise.reject(new DOMException('expired', 'NotSupportedError'))
    )
    await toggleAsync()
    await waitFor(() => {
      expect(latest.isPlaying).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('track/1')
    expect(audio().currentTime).toBe(12)
  })

  it('does not refetch when the browser blocks playback', async () => {
    await playThenPause()
    deezerMock.mockClear()
    play.mockImplementationOnce(() =>
      Promise.reject(new DOMException('blocked', 'NotAllowedError'))
    )
    await toggleAsync()
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('keeps the paused position when the resume refetch fails', async () => {
    await playThenPause()
    audio().currentTime = 12
    deezerMock.mockRejectedValueOnce(new Error('offline'))
    play.mockImplementationOnce(() =>
      Promise.reject(new DOMException('expired', 'NotSupportedError'))
    )
    await toggleAsync()
    await waitFor(() => {
      expect(latest.isLoading).toBe(false)
    })
    expect(audio().getAttribute('src')).toBeNull()
    await toggleAsync()
    await waitFor(() => {
      expect(latest.isPlaying).toBe(true)
    })
    expect(audio().currentTime).toBe(12)
  })

  it('does not refetch when a resume is aborted', async () => {
    await playThenPause()
    deezerMock.mockClear()
    play.mockImplementationOnce(() => Promise.reject(new DOMException('aborted', 'AbortError')))
    await toggleAsync()
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('advances on ended and skips unplayable tracks', async () => {
    const list = [track('1'), track('2', false), track('3')]
    await act(() => controls.playTrack(list[0], list))
    await ended()
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('3')
    })
    expect(latest.queueIndex).toBe(2)
  })

  it('stops at the end of the queue when repeat is off', async () => {
    const list = [track('1')]
    await act(() => controls.playTrack(list[0], list))
    await ended()
    expect(pause).toHaveBeenCalled()
    expect(latest.isPlaying).toBe(false)
  })

  it('wraps to the first playable track when repeat is context', async () => {
    await playLastOfTwo()
    act(() => {
      controls.cycleRepeat()
    })
    expect(latest.repeat).toBe('context')
    await ended()
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
    await ended()
    expect(play).toHaveBeenCalledTimes(1)
    expect(deezerMock).not.toHaveBeenCalled()
    expect(latest.currentTrack?.id).toBe('1')
  })

  it('ignores a rejected play() when replaying with repeat track', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(list[0], list))
    act(() => {
      controls.cycleRepeat()
      controls.cycleRepeat()
    })
    play.mockClear()
    play.mockRejectedValueOnce(new Error('blocked'))
    await ended()
    expect(play).toHaveBeenCalledTimes(1)
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
    await playLastOfTwo()
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
    deezerMock.mockImplementation((path: string) =>
      Promise.resolve(fresh(list[Number(path.slice(-1)) - 1]))
    )
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
    await toggleAsync()
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
    const list = [
      {
        ...first,
        album: {
          ...first.album,
          images: [{ url: 'https://img.test/1.jpg', width: 500, height: 500 }],
        },
      },
      track('2'),
    ]
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

  it('pauses on toggle while the preview is playing', async () => {
    await act(() => controls.playTrack(track('1')))
    Object.defineProperty(audio(), 'paused', { configurable: true, value: false })
    pause.mockClear()
    act(() => {
      controls.toggle()
    })
    expect(pause).toHaveBeenCalled()
    expect(latest.isPlaying).toBe(false)
  })

  it('stops at the end when shuffle has no other playable track', async () => {
    await act(() => controls.playTrack(track('1')))
    act(() => {
      controls.setShuffle(true)
    })
    pause.mockClear()
    act(() => {
      controls.next()
    })
    expect(pause).toHaveBeenCalled()
  })

  it('does nothing once the provider is unmounted', async () => {
    const saved = controls
    cleanup()
    deezerMock.mockClear()
    await act(() => saved.playTrack(track('1')))
    act(() => {
      saved.seek(1000)
    })
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('leaves loading cleared when the fresh track has no preview', async () => {
    deezerMock.mockImplementation((path: string) =>
      Promise.resolve({ ...fresh(track(path.split('/')[1])), preview_url: null })
    )
    await act(() => controls.playTrack(track('1')))
    expect(latest.isLoading).toBe(false)
    expect(latest.isPlaying).toBe(false)
  })

  it('drops a play that finishes after a newer one started', async () => {
    let release: () => void = () => undefined
    play.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        })
    )
    let first: Promise<void> = Promise.resolve()
    await act(async () => {
      first = controls.playTrack(track('1'))
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(() => controls.playTrack(track('2')))
    await act(async () => {
      release()
      await first
    })
    expect(latest.currentTrack?.id).toBe('2')
    expect(readRecent().map((t) => t.id)).toEqual(['2'])
  })

  it('ignores a failed resume that a newer request superseded', async () => {
    await playThenPause()
    let reject: (e: unknown) => void = () => undefined
    play.mockImplementationOnce(
      () =>
        new Promise<void>((_, rej) => {
          reject = rej
        })
    )
    act(() => {
      controls.toggle()
    })
    await act(() => controls.playTrack(track('2')))
    deezerMock.mockClear()
    await act(async () => {
      reject(new Error('late'))
      await Promise.resolve()
    })
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('reads the finite duration on timeupdate', async () => {
    await act(() => controls.playTrack(track('1')))
    Object.defineProperty(audio(), 'duration', { configurable: true, value: 20 })
    act(() => {
      fireEvent(audio(), new Event('timeupdate'))
    })
    expect(screen.getByTestId('progress').dataset.duration).toBe('20000')
  })

  it('starts with zero progress', () => {
    expect(screen.getByTestId('progress').textContent).toBe('0')
  })

  it('advances to the next track mid-queue when repeat is context', async () => {
    const list = [track('1'), track('2'), track('3')]
    await act(() => controls.playTrack(list[0], list))
    act(() => {
      controls.cycleRepeat()
    })
    await ended()
    await waitFor(() => {
      expect(latest.queueIndex).toBe(1)
    })
  })

  it('keeps the last track and fetches nothing at the end of the queue', async () => {
    await playLastOfTwo()
    deezerMock.mockClear()
    await ended()
    expect(latest.queueIndex).toBe(1)
    expect(latest.currentTrack?.id).toBe('2')
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('never shuffles onto the current or an unplayable track', async () => {
    const list = [track('1'), track('2', false), track('3')]
    await act(() => controls.playTrack(list[0], list))
    act(() => {
      controls.setShuffle(true)
    })
    expect(latest.shuffle).toBe(true)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await act(async () => {
      controls.next()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.queueIndex).toBe(2)
    })
  })

  it('stops when shuffle finds only unplayable tracks', async () => {
    const list = [track('1'), track('2', false)]
    await act(() => controls.playTrack(list[0], list))
    act(() => {
      controls.setShuffle(true)
    })
    deezerMock.mockClear()
    act(() => {
      controls.next()
    })
    expect(latest.queueIndex).toBe(0)
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('restarts the first track on previous instead of leaving the queue', async () => {
    const list = [track('1', false), track('2')]
    await act(() => controls.playTrack(list[1], list))
    audio().currentTime = 1
    deezerMock.mockClear()
    act(() => {
      controls.previous()
    })
    expect(audio().currentTime).toBe(0)
    expect(latest.queueIndex).toBe(1)
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('goes back on previous at exactly 3 seconds', async () => {
    await playLastOfTwo()
    audio().currentTime = 3
    await act(async () => {
      controls.previous()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(latest.currentTrack?.id).toBe('1')
    })
  })

  it('plays a track alone when the list does not contain it', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(track('9'), list))
    expect(latest.queue.map((t) => t.id)).toEqual(['9'])
    expect(latest.queueIndex).toBe(0)
  })

  it('falls back to searching the list when the index is out of range or missing', async () => {
    const list = [track('1'), track('2')]
    await act(() => controls.playTrack(list[1], list, 99))
    expect(latest.queueIndex).toBe(1)
    await act(() => controls.playTrack(track('5'), undefined, 0))
    expect(latest.queue.map((t) => t.id)).toEqual(['5'])
  })

  it('keeps loading while a newer request is still pending', async () => {
    const releases: ((t: Track) => void)[] = []
    deezerMock.mockImplementation(
      () =>
        new Promise<Track>((resolve) => {
          releases.push(resolve)
        })
    )
    let first: Promise<void> = Promise.resolve()
    let second: Promise<void> = Promise.resolve()
    act(() => {
      first = controls.playTrack(track('1'))
      second = controls.playTrack(track('2'))
    })
    await act(async () => {
      releases[0](fresh(track('1')))
      await first
    })
    expect(latest.isLoading).toBe(true)
    await act(async () => {
      releases[1](fresh(track('2')))
      await second
    })
    expect(latest.isLoading).toBe(false)
  })

  it('ignores toggle before any track and in the same tick a play starts', async () => {
    act(() => {
      controls.toggle()
    })
    expect(deezerMock).not.toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
    expect(HTMLMediaElement.prototype.load).not.toHaveBeenCalled()
    await act(async () => {
      const pending = controls.playTrack(track('1'))
      controls.toggle()
      await pending
    })
    expect(deezerMock).toHaveBeenCalledTimes(1)
  })

  it('shows the resume position while the refetch loads', async () => {
    await act(() => controls.playTrack(track('1')))
    audio().currentTime = 7
    play.mockRejectedValueOnce(new Error('expired'))
    await toggleAsync()
    await waitFor(() => {
      expect(deezerMock).toHaveBeenCalledTimes(2)
    })
    expect(screen.getByTestId('progress').textContent).toBe('7000')
  })

  it('ignores the media play key while already playing', async () => {
    await act(() => controls.playTrack(track('1')))
    Object.defineProperty(audio(), 'paused', { configurable: true, value: false })
    pause.mockClear()
    play.mockClear()
    act(() => {
      actions.play?.()
    })
    expect(play).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled()
  })

  it('joins several artists and leaves artwork empty without a cover', async () => {
    const t = track('1')
    const duo = { ...t, artists: [...t.artists, { ...t.artists[0], id: 'b', name: 'Other' }] }
    await act(() => controls.playTrack(duo))
    expect(navigator.mediaSession.metadata).toMatchObject({ artist: 'Artist, Other', artwork: [] })
  })
})

describe('PlayerProvider without a media session', () => {
  it('plays without registering handlers', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    deezerMock.mockImplementation((path: string) =>
      Promise.resolve(fresh(track(path.split('/')[1])))
    )
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>
    )
    await act(() => controls.playTrack(track('1')))
    expect(latest.currentTrack?.id).toBe('1')
    vi.restoreAllMocks()
    deezerMock.mockReset()
    localStorage.clear()
  })
})

describe('usePlayer', () => {
  it('throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Probe />)).toThrow('usePlayer must be used inside PlayerProvider')
    spy.mockRestore()
  })
})

describe('useProgress', () => {
  it('reads zero outside the provider', () => {
    function Bare() {
      const { progressMs, durationMs } = useProgress()
      return <span data-testid="bare">{`${String(progressMs)}/${String(durationMs)}`}</span>
    }
    render(<Bare />)
    expect(screen.getByTestId('bare').textContent).toBe('0/0')
  })
})
