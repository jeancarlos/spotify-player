import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { NewReleasesResponse } from '@/types/spotify'

export function useNewReleases(limit = 20) {
  return useQuery({
    queryKey: ['new-releases', limit],
    queryFn: async () => {
      const { data } = await api.get<NewReleasesResponse>('/browse/new-releases', {
        params: { limit, country: 'BR' },
      })
      return data.albums.items
    },
  })
}
