import { useRef, useState, useEffect, useCallback } from 'react'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useAuth } from '@/hooks/useAuth'

interface ProgressBaseline {
  progress: number
  time: number
  isPlaying: boolean
}

export function useProgressEngine(): {
  currentProgress: number
  seekTo: (ms: number) => void
} {
  const { state: authState } = useAuth()
  const { data } = useNowPlaying(authState.isAuthenticated)

  // baselineRef is ONLY accessed inside effects to satisfy React 19 purity rules
  const baselineRef = useRef<ProgressBaseline>({
    progress: 0,
    time: 0,
    isPlaying: false,
  })

  const [displayProgress, setDisplayProgress] = useState(0)

  // Unified effect to handle both API sync and timer ticker
  useEffect(() => {
    // 1. Sync baseline with incoming data
    if (data && data.progress_ms !== null) {
      const now = Date.now()
      const adjusted = data.is_playing
        ? data.progress_ms + (now - data.timestamp)
        : data.progress_ms

      baselineRef.current = {
        progress: adjusted,
        time: now,
        isPlaying: data.is_playing,
      }
      
      // We don't call setDisplayProgress here to avoid cascading render warning.
      // Instead, we let the first interval tick or a deferred call handle it.
    }

    // 2. Start ticker
    const update = () => {
      const b = baselineRef.current
      if (b.time === 0) return
      const now = Date.now()
      const current = b.isPlaying ? b.progress + (now - b.time) : b.progress
      setDisplayProgress(current)
    }

    // Run once immediately (deferred to avoid cascading render)
    const timeoutId = setTimeout(update, 0)
    const intervalId = setInterval(update, 100)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [data])

  const seekTo = useCallback((ms: number) => {
    const now = Date.now()
    baselineRef.current = {
      ...baselineRef.current,
      progress: ms,
      time: now,
    }
    setDisplayProgress(ms)
  }, [])

  return { currentProgress: displayProgress, seekTo }
}
