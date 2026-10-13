import { useEffect, useState } from 'react'
import { readRecent } from '@/utils/recentStorage'
import type { SpotifyTrack } from '@/types/spotify'

export function useRecentlyPlayed(limit: number): { data: SpotifyTrack[] } {
  const [data, setData] = useState<SpotifyTrack[]>(() => readRecent().slice(0, limit))

  useEffect(() => {
    const refresh = () => { setData(readRecent().slice(0, limit)); }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'spoter_recent_v1' || e.key === null) refresh()
    }
    refresh()
    window.addEventListener('spoter:recent-changed', refresh)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('spoter:recent-changed', refresh)
      window.removeEventListener('storage', onStorage)
    }
  }, [limit])

  return { data }
}
