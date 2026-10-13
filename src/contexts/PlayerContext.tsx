import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { playerReducer, initialPlayerState, type PlayerAction, type PlayerState } from './playerReducer'
import { deezer } from '@/lib/deezer'
import { isPlayable, toTrack, type DzTrack } from '@/lib/deezerMappers'
import { pushRecent } from '@/utils/recentStorage'
import type { SpotifyTrack } from '@/types/spotify'

export interface PlayerControls {
  playTrack(track: SpotifyTrack, list?: SpotifyTrack[]): Promise<void>
  toggle(): void
  next(): void
  previous(): void
  seek(ms: number): void
  setShuffle(on: boolean): void
  cycleRepeat(): void
}

interface PlayerContextValue {
  state: PlayerState
  dispatch: Dispatch<PlayerAction>
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

function stepPlayable(queue: SpotifyTrack[], from: number, step: 1 | -1): number {
  for (let i = from + step; i >= 0 && i < queue.length; i += step) {
    if (isPlayable(queue[i])) return i
  }
  return -1
}

function randomPlayable(queue: SpotifyTrack[], current: number): number {
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

  const startAt = useCallback(async (queue: SpotifyTrack[], index: number) => {
    const audio = audioRef.current
    const track = queue[index]
    if (!audio) return
    const request = ++requestRef.current
    audio.pause()
    stateRef.current = { ...stateRef.current, queue, queueIndex: index, currentTrack: track }
    dispatch({ type: 'SET_QUEUE', payload: queue })
    dispatch({ type: 'SET_QUEUE_INDEX', payload: index })
    dispatch({ type: 'SET_TRACK', payload: track })
    dispatch({ type: 'SET_LOADING', payload: true })
    setProgress({ progressMs: 0, durationMs: PREVIEW_MS })
    try {
      const fresh = toTrack(await deezer<DzTrack>(`track/${track.id}`))
      if (request !== requestRef.current) return
      if (!fresh.preview_url) throw new Error('unplayable')
      audio.src = fresh.preview_url
      await audio.play()
      if (request !== requestRef.current) return
      dispatch({ type: 'SET_PLAYING', payload: true })
      pushRecent(track)
    } catch {
      if (request === requestRef.current) dispatch({ type: 'SET_PLAYING', payload: false })
    } finally {
      if (request === requestRef.current) dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const stop = useCallback(() => {
    audioRef.current?.pause()
    dispatch({ type: 'SET_PLAYING', payload: false })
  }, [])

  const playTrack = useCallback(
    async (track: SpotifyTrack, list?: SpotifyTrack[]) => {
      if (!isPlayable(track)) return
      const queue = list?.some((t) => t.uri === track.uri) ? list : [track]
      await startAt(queue, queue.findIndex((t) => t.uri === track.uri))
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
    if (!audio || !stateRef.current.currentTrack) return
    if (!audio.paused) {
      stop()
      return
    }
    audio
      .play()
      .then(() => {
        dispatch({ type: 'SET_PLAYING', payload: true })
      })
      .catch(() => {
        dispatch({ type: 'SET_PLAYING', payload: false })
      })
  }, [stop])

  const seek = useCallback((ms: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = ms / 1000
    setProgress((p) => ({ ...p, progressMs: ms }))
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
      audio.play().catch(() => {
        dispatch({ type: 'SET_PLAYING', payload: false })
      })
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
    }
  }, [next])

  const controls = useMemo<PlayerControls>(
    () => ({ playTrack, toggle, next, previous, seek, setShuffle, cycleRepeat }),
    [playTrack, toggle, next, previous, seek, setShuffle, cycleRepeat]
  )
  const value = useMemo(() => ({ state, dispatch, controls }), [state, controls])

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
