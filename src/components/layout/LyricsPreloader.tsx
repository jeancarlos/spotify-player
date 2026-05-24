import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useQueue } from '@/hooks/queries/useQueue'
import { useAuth } from '@/hooks/useAuth'
import { fetchLyrics, cleanTitle } from '@/hooks/queries/useLyrics'

export function LyricsPreloader() {
  const { state: authState } = useAuth()
  const { data: queueData } = useQueue(authState.isAuthenticated)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!queueData?.queue || queueData.queue.length === 0) return

    // Preload lyrics for the first 2 tracks in the queue
    const tracksToPreload = queueData.queue.slice(0, 2)

    tracksToPreload.forEach((track) => {
      const artist = track.artists[0]?.name
      const title = track.name
      const album = track.album.name
      const durationMs = track.duration_ms

      if (artist && title) {
        const cleanedTitle = cleanTitle(title)
        const queryKey = ['lyrics', artist, cleanedTitle, durationMs]

        // Only prefetch if not already in cache or being fetched
        const existingData = queryClient.getQueryData(queryKey)
        if (!existingData) {
          void queryClient.prefetchQuery({
            queryKey,
            queryFn: async () => fetchLyrics({ artist, title, album, durationMs }),
            staleTime: Infinity,
          })
        }
      }
    })
  }, [queueData, queryClient])

  return null
}
