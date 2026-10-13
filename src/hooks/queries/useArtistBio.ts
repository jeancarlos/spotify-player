import { useQuery } from '@tanstack/react-query'
import { TIME_60_MINUTES } from '@/utils/constants'
import { useTranslation } from 'react-i18next'
import { findWikiSummary, type WikiResult } from '@/lib/wikipedia'

export function useArtistBio(artistName: string | undefined) {
  const { i18n } = useTranslation()
  const preferPt = i18n.language === 'pt-BR'

  return useQuery<WikiResult | null>({
    queryKey: ['artist-bio', artistName, i18n.language],
    enabled: !!artistName,
    staleTime: TIME_60_MINUTES,
    queryFn: async () =>
      artistName
        ? findWikiSummary({ query: artistName, match: artistName, truncate: 500, preferPt })
        : null,
  })
}
