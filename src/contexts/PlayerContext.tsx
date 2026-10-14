import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { playerReducer, initialPlayerState, type PlayerState } from './playerReducer'
import { deezer } from '@/lib/deezer'
import { isPlayable, toTrack, type DzTrack } from '@/lib/deezerMappers'
import { pushRecent } from '@/utils/recentStorage'
import type { Track } from '@/types/music'

export interface PlayerControls {
  playTrack(track: Track, list?: Track[], index?: number): Promise<void>
  toggle(): void
  next(): void
  previous(): void
  seek(ms: number): void
  setShuffle(on: boolean): void
  cycleRepeat(): void
}

interface PlayerContextValue {
  state: PlayerState
  controls: PlayerControls
}

interface ProgressValue {
  progressMs: number
  durationMs: number
}

const PREVIEW_MS = 30000
const RESTART_THRESHOLD_S = 3
const REPEAT_ORDER = { off: 'context', context: 'track', track: 'off' } as const

export const PlayerContext = createContext<PlayerContextValue | null>(null)
const ProgressContext = createContext<ProgressValue>({ progressMs: 0, durationMs: 0 })

function stepPlayable(queue: Track[], from: number, step: 1 | -1): number {
  for (let i = from + step; i >= 0 && i < queue.length; i += step) {
    if (isPlayable(queue[i])) return i
  }
  return -1
}

function randomPlayable(queue: Track[], current: number): number {
  const candidates = queue.map((_, i) => i).filter((i) => i !== current && isPlayable(queue[i]))
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : -1
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState)
  const [progress, setProgress] = useState<ProgressValue>({ progressMs: 0, durationMs: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)
  const stateRef = useRef(state)
  const requestRef = useRef(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const startAt = useCallback(async (queue: Track[], index: number, fromS = 0) => {
    const audio = audioRef.current
    const track = queue[index]
    if (!audio) return
    const request = ++requestRef.current
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    stateRef.current = { ...stateRef.current, queue, queueIndex: index, currentTrack: track, isLoading: true }
    dispatch({ type: 'SET_PLAYING', payload: false })
    dispatch({ type: 'SET_QUEUE', payload: queue })
    dispatch({ type: 'SET_QUEUE_INDEX', payload: index })
    dispatch({ type: 'SET_TRACK', payload: track })
    dispatch({ type: 'SET_LOADING', payload: true })
    setProgress({ progressMs: fromS * 1000, durationMs: PREVIEW_MS })
    try {
      const fresh = toTrack(await deezer<DzTrack>(`track/${track.id}`))
      if (request !== requestRef.current) return
      if (!fresh.preview_url) throw new Error('unplayable')
      audio.src = fresh.preview_url
      audio.currentTime = fromS
      await audio.play()
      if (request !== requestRef.current) return
      pushRecent(track)
    } catch {
      return
    } finally {
      if (request === requestRef.current) dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const stop = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const playTrack = useCallback(
    async (track: Track, list?: Track[], index?: number) => {
      if (!isPlayable(track)) return
      const at =
        index !== undefined && list?.[index]?.uri === track.uri
          ? index
          : (list?.findIndex((t) => t.uri === track.uri) ?? -1)
      if (!list || at === -1) await startAt([track], 0)
      else await startAt(list, at)
    },
    [startAt]
  )

  const next = useCallback(() => {
    const { queue, queueIndex, shuffle, repeat } = stateRef.current
    let index = shuffle ? randomPlayable(queue, queueIndex) : stepPlayable(queue, queueIndex, 1)
    if (index === -1 && repeat === 'context') index = stepPlayable(queue, -1, 1)
    if (index === -1) {
      stop()
      return
    }
    void startAt(queue, index)
  }, [startAt, stop])

  const previous = useCallback(() => {
    const audio = audioRef.current
    const { queue, queueIndex } = stateRef.current
    const index = stepPlayable(queue, queueIndex, -1)
    if (audio && (index === -1 || audio.currentTime > RESTART_THRESHOLD_S)) {
      audio.currentTime = 0
      return
    }
    void startAt(queue, index)
  }, [startAt])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    const { currentTrack, isLoading, queue, queueIndex } = stateRef.current
    if (!audio || !currentTrack || isLoading) return
    if (!audio.getAttribute('src')) {
      void startAt(queue, queueIndex)
      return
    }
    if (!audio.paused) {
      stop()
      return
    }
    const request = requestRef.current
    audio.play().catch((error: unknown) => {
      if (request !== requestRef.current) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      void startAt(queue, queueIndex, audio.currentTime)
    })
  }, [startAt, stop])

  const seek = useCallback((ms: number) => {
    const audio = audioRef.current
    if (!audio) return
    const durationMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : PREVIEW_MS
    const clamped = Math.min(Math.max(ms, 0), durationMs)
    audio.currentTime = clamped / 1000
    setProgress((p) => ({ ...p, progressMs: clamped }))
  }, [])

  const setShuffle = useCallback((on: boolean) => {
    stateRef.current = { ...stateRef.current, shuffle: on }
    dispatch({ type: 'SET_SHUFFLE', payload: on })
  }, [])

  const cycleRepeat = useCallback(() => {
    const repeat = REPEAT_ORDER[stateRef.current.repeat]
    stateRef.current = { ...stateRef.current, repeat }
    dispatch({ type: 'SET_REPEAT', payload: repeat })
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setProgress({
        progressMs: audio.currentTime * 1000,
        durationMs: Number.isFinite(audio.duration) ? audio.duration * 1000 : PREVIEW_MS,
      })
    }
    const onEnded = () => {
      if (stateRef.current.repeat !== 'track') {
        next()
        return
      }
      audio.currentTime = 0
      audio.play().catch(() => undefined)
    }
    const onPlay = () => {
      dispatch({ type: 'SET_PLAYING', payload: true })
    }
    const onPause = () => {
      dispatch({ type: 'SET_PLAYING', payload: false })
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onPause)
    }
  }, [next])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const handlers: [MediaSessionAction, () => void][] = [
      [
        'play',
        () => {
          if (audioRef.current?.paused) toggle()
        },
      ],
      [
        'pause',
        () => {
          audioRef.current?.pause()
        },
      ],
      ['nexttrack', next],
      ['previoustrack', previous],
    ]
    for (const [action, handler] of handlers) navigator.mediaSession.setActionHandler(action, handler)
  }, [toggle, next, previous])

  const { currentTrack } = state
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return
    const art = currentTrack.album.images[0]?.url
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artists.map((a) => a.name).join(', '),
      album: currentTrack.album.name,
      artwork: art ? [{ src: art }] : [],
    })
  }, [currentTrack])

  const controls = useMemo<PlayerControls>(
    () => ({ playTrack, toggle, next, previous, seek, setShuffle, cycleRepeat }),
    [playTrack, toggle, next, previous, seek, setShuffle, cycleRepeat]
  )
  const value = useMemo(() => ({ state, controls }), [state, controls])

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>
        {children}
        <audio ref={audioRef} data-testid="player-audio" preload="none" />
      </ProgressContext.Provider>
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}

export function useProgress(): ProgressValue {
  return useContext(ProgressContext)
}
