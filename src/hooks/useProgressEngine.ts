import { useRef, useState, useEffect, useCallback } from 'react'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useAuth } from '@/hooks/useAuth'

interface ProgressRef {
  baseProgress: number
  baseTime: number
  isPlaying: boolean
}

// Sentinel to detect first render (distinct from null/undefined data values)
const UNSET = Symbol('unset')

export function useProgressEngine(): {
  currentProgress: number
  seekTo: (ms: number) => void
} {
  const { state: authState } = useAuth()
  const { data } = useNowPlaying(authState.isAuthenticated)

  const ref = useRef<ProgressRef>({ baseProgress: 0, baseTime: Date.now(), isPlaying: false })
  const lastDataRef = useRef<typeof data | typeof UNSET>(UNSET)
  const [, setTick] = useState(0)

  // Sync ref inline on every render when data changes — avoids useEffect delay in tests
  if (data !== lastDataRef.current) {
    lastDataRef.current = data
    if (data && data.progress_ms !== null) {
      const adjustedProgress = data.is_playing
        ? data.progress_ms + (Date.now() - data.timestamp)
        : data.progress_ms
      ref.current = { baseProgress: adjustedProgress, baseTime: Date.now(), isPlaying: data.is_playing }
    }
  }

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const currentProgress = ref.current.isPlaying
    ? ref.current.baseProgress + (Date.now() - ref.current.baseTime)
    : ref.current.baseProgress

  const seekTo = useCallback((ms: number) => {
    ref.current = { baseProgress: ms, baseTime: Date.now(), isPlaying: ref.current.isPlaying }
    setTick(t => t + 1)
  }, [])

  return { currentProgress, seekTo }
}
