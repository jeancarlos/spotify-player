import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { useNewReleases } from '@/hooks/queries/useNewReleases'
import { useUserTopArtists } from '@/hooks/queries/useUserTopArtists'
import { useRecommendations } from '@/hooks/queries/useRecommendations'
import { SectionRow } from '@/components/shared/SectionRow'
import { TrackCard } from '@/components/shared/TrackCard'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { usePlayer } from '@/hooks/usePlayer'
import { extractPalette } from '@/lib/colorThief'
import type { SpotifyTrack } from '@/types/spotify'

export function Home() {
  const { t } = useTranslation()
  const { dispatch } = usePlayer()

  const recentlyPlayed = useRecentlyPlayed(20)
  const newReleases = useNewReleases(20)
  const topArtists = useUserTopArtists('short_term', 5)
  const seedIds = topArtists.data?.map(a => a.id) ?? []
  const recommendations = useRecommendations(seedIds, 20)

  const handlePlay = useCallback(
    async (track: SpotifyTrack) => {
      dispatch({ type: 'SET_TRACK', payload: track })
      dispatch({ type: 'TOGGLE_PLAY' })
      const imageUrl = track.album.images[0]?.url
      if (imageUrl) {
        const palette = await extractPalette(imageUrl)
        if (palette) dispatch({ type: 'SET_PALETTE', payload: palette })
      }
    },
    [dispatch]
  )

  return (
    <div className="p-6 space-y-8 min-h-full">
      <SectionRow title={t('home.recentlyPlayed')} isLoading={recentlyPlayed.isPending}>
        {recentlyPlayed.data?.map(item => (
          <TrackCard key={item.played_at} track={item.track} onPlay={handlePlay} />
        ))}
      </SectionRow>

      <SectionRow
        title={t('home.newReleases')}
        seeMoreHref="/artists"
        isLoading={newReleases.isPending}
      >
        {newReleases.data?.map(album => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </SectionRow>

      <SectionRow
        title={t('home.recommendations')}
        isLoading={recommendations.isPending || topArtists.isPending}
      >
        {recommendations.data?.map(track => (
          <TrackCard key={track.id} track={track} onPlay={handlePlay} />
        ))}
      </SectionRow>
    </div>
  )
}
