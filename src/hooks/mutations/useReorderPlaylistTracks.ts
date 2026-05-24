import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'

interface ReorderVars {
  playlistId: string
  rangeStart: number
  insertBefore: number
}

export function useReorderPlaylistTracks() {
  return useMutation<undefined, Error, ReorderVars>({
    mutationFn: async ({ playlistId, rangeStart, insertBefore }) => {
      await api.put(`/playlists/${playlistId}/tracks`, {
        range_start: rangeStart,
        insert_before: insertBefore,
      })
    },
  })
}
