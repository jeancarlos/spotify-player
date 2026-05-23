import { useRef, useState, useEffect, useCallback } from 'react'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useAuth } from '@/hooks/useAuth'

interface ProgressRef {
  baseProgress: number
  baseTime: number
  isPlaying: boolean
}

export function useProgressEngine(): {
  currentProgress: number
  seekTo: (ms: number) => void
} {
  const { state: authState } = useAuth()
  const { data } = useNowPlaying(authState.isAuthenticated)

  // We use a ref to track the "baseline" progress to avoid frequent re-renders
  // and to follow React's rules about ref access during render.
  const baselineRef = useRef<ProgressRef>({
    baseProgress: 0,
    baseTime: 0,
    isPlaying: false,
  })

  const [currentProgress, setCurrentProgress] = useState(0)

  // Sync ref with incoming data from the API inside an effect
  useEffect(() => {
    if (data && data.progress_ms !== null) {
      const now = Date.now()
      const adjustedProgress = data.is_playing
        ? data.progress_ms + (now - data.timestamp)
        : data.progress_ms

      baselineRef.current = {
        baseProgress: adjustedProgress,
        baseTime: now,
        isPlaying: data.is_playing,
      }
      // Defer to avoid cascading render lint error
      setTimeout(() => {
        setCurrentProgress(adjustedProgress)
      }, 0)
    }
  }, [data])

  // Timer loop to update the UI between API polls
  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const b = baselineRef.current
      // If we haven't received any data yet, baseTime might be 0
      if (b.baseTime === 0) return

      const progress = b.isPlaying ? b.baseProgress + (now - b.baseTime) : b.baseProgress
      setCurrentProgress(progress)
    }

    update()
    const id = setInterval(update, 100)
    return () => clearInterval(id)
  }, [])

  const seekTo = useCallback((ms: number) => {
    const now = Date.now()
    baselineRef.current = {
      ...baselineRef.current,
      baseProgress: ms,
      baseTime: now,
    }
    setCurrentProgress(ms)
  }, [])

  return { currentProgress, seekTo }
}
