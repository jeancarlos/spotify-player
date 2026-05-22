import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { usePlayer } from '@/hooks/usePlayer'
import { formatNumber } from '@/utils/formatNumber'
import { TrackRow } from '@/components/shared/TrackRow'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

type Tab = 'tracks' | 'albums'

const TRACKS_PER_PAGE = 10

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { dispatch, state } = usePlayer()

  const [tab, setTab] = useState<Tab>('tracks')
  const [tracksPage, setTracksPage] = useState(1)
  const [albumsPage, setAlbumsPage] = useState(1)

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumsPage)

  const pagedTracks = topTracks.data?.slice((tracksPage - 1) * TRACKS_PER_PAGE, tracksPage * TRACKS_PER_PAGE) ?? []
  const totalTrackPages = Math.ceil((topTracks.data?.length ?? 0) / TRACKS_PER_PAGE)

  const handlePlay = useCallback(
    (track: SpotifyTrack) => {
      dispatch({ type: 'SET_TRACK', payload: track })
      if (!state.isPlaying) dispatch({ type: 'TOGGLE_PLAY' })
      // Palette extraction is handled centrally by PlayerSync
    },
    [dispatch, state.isPlaying]
  )

  if (!id) return null

  if (artist.isPending) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!artist.data) return null

  const heroImage = artist.data.images[0]?.url

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden rounded-b-2xl">
        {heroImage && (
          <img src={heroImage} alt={artist.data.name} className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <button
          onClick={() => navigate('/artists')}
          className="absolute top-4 left-4 glass-button p-2 rounded-xl"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-bold drop-shadow">{artist.data.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-white/70">
              {formatNumber(artist.data.followers.total)} followers
            </span>
            <span className="text-sm text-white/50">
              {artist.data.genres.slice(0, 3).join(' · ')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-white/40">{t('artistDetail.popularity')}</span>
            <div className="h-1 w-32 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full"
                style={{ width: `${artist.data.popularity}%` }}
              />
            </div>
            <span className="text-xs text-white/40">{artist.data.popularity}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 space-y-4">
        <div className="flex glass-card-md rounded-xl overflow-hidden w-fit">
          {(['tracks', 'albums'] as Tab[]).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={cn(
                'px-5 py-2 text-sm transition-colors',
                tab === tabKey ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
              )}
            >
              {tabKey === 'tracks' ? t('artistDetail.topTracks') : t('artistDetail.albums')}
            </button>
          ))}
        </div>

        {/* Top Tracks */}
        {tab === 'tracks' && (
          <div className="space-y-1">
            {topTracks.isPending
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
              : pagedTracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={(tracksPage - 1) * TRACKS_PER_PAGE + i}
                    onPlay={handlePlay}
                  />
                ))}
            {totalTrackPages > 1 && (
              <div className="flex justify-center gap-3 pt-2">
                <button
                  disabled={tracksPage === 1}
                  onClick={() => setTracksPage(p => p - 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >← {t('artistDetail.previous')}</button>
                <span className="text-xs text-white/50 self-center">{tracksPage}/{totalTrackPages}</span>
                <button
                  disabled={tracksPage >= totalTrackPages}
                  onClick={() => setTracksPage(p => p + 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >{t('artistDetail.next')} →</button>
              </div>
            )}
          </div>
        )}

        {/* Albums */}
        {tab === 'albums' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {albums.isPending
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-40 h-56 rounded-2xl" />)
                : albums.data?.items.map(album => <AlbumCard key={album.id} album={album} />)}
            </div>
            {albums.data && albums.data.total > albums.data.limit && (
              <div className="flex justify-center gap-3">
                <button
                  disabled={albumsPage === 1}
                  onClick={() => setAlbumsPage(p => p - 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >← {t('artistDetail.previous')}</button>
                <span className="text-xs text-white/50 self-center">{albumsPage}</span>
                <button
                  disabled={!albums.data.next}
                  onClick={() => setAlbumsPage(p => p + 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >{t('artistDetail.next')} →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
