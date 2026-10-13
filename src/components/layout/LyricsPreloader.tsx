import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePlayer } from '@/contexts/PlayerContext'
import { fetchLyrics, cleanTitle } from '@/hooks/queries/useLyrics'

export function LyricsPreloader() {
  const { state } = usePlayer()
  const queryClient = useQueryClient()
  const { queue, queueIndex } = state

  useEffect(() => {
    queue.slice(queueIndex + 1, queueIndex + 3).forEach((track) => {
      const artist = track.artists[0]?.name
      const title = track.name
      const album = track.album.name
      const durationMs = track.duration_ms
      if (!artist || !title) return
      const queryKey = ['lyrics', artist, cleanTitle(title), durationMs]
      if (queryClient.getQueryData(queryKey)) return
      void queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => fetchLyrics({ artist, title, album, durationMs }),
        staleTime: Infinity,
      })
    })
  }, [queue, queueIndex, queryClient])

  return null
}
