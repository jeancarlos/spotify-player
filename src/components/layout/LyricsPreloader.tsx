import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePlayer } from '@/contexts/PlayerContext'
import { fetchLyrics, lyricsKey } from '@/hooks/queries/useLyrics'

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
      const queryKey = lyricsKey({ artist, title, album, durationMs })
      if (queryClient.getQueryData(queryKey)) return
      queryClient
        .query({
          queryKey,
          queryFn: async () => fetchLyrics({ artist, title, album, durationMs }),
          staleTime: Infinity,
        })
        .catch(() => undefined)
    })
  }, [queue, queueIndex, queryClient])

  return null
}
