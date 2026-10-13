import { useQuery } from '@tanstack/react-query'
import { TIME_60_MINUTES } from '@/utils/constants'
import { useTranslation } from 'react-i18next'
import { findWikiSummary, type WikiResult } from '@/lib/wikipedia'

export function useTrackWikipedia(trackName: string | undefined, artistName: string | undefined) {
  const { i18n } = useTranslation()
  const currentLang = i18n.language.startsWith('pt') ? 'pt' : 'en'

  return useQuery<WikiResult | null>({
    queryKey: ['track-wikipedia', trackName, artistName, currentLang],
    enabled: !!trackName && !!artistName,
    staleTime: TIME_60_MINUTES,
    queryFn: async () => {
      if (!trackName || !artistName) return null
      return findWikiSummary({
        query: `${trackName} ${artistName} song`,
        match: trackName,
        truncate: 400,
        preferPt: currentLang === 'pt',
        safe: true,
      })
    },
  })
}
