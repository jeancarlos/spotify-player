import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import type { SpotifyTrack } from '@/types/spotify'

interface ArtistTopTracksListProps {
  tracks: SpotifyTrack[]
  artistUri?: string
  onPlayTrack: (track: SpotifyTrack) => void
  onPlayContext: (uri: string) => void
}

export function ArtistTopTracksList({
  tracks,
  artistUri,
  onPlayTrack,
  onPlayContext,
}: ArtistTopTracksListProps) {
  const { t } = useTranslation()

  if (!tracks || tracks.length === 0) return null

  return (
    <section className="mb-8">
      <h3 className="text-sm font-bold text-black/50 mb-3 px-2">
        {t('artistDetail.topTracksRanked')}
      </h3>
      <div className="space-y-1">
        {tracks.slice(0, 5).map((track, i) => (
          <div
            key={track.id}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group focus:outline-none focus:bg-black/5"
            onClick={() => onPlayTrack(track)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPlayTrack(track)
              }
            }}
          >
            <div className="w-6 shrink-0 flex items-center justify-center">
              <span className="text-xs font-bold text-black/30 tabular-nums group-hover:hidden">
                {String(i + 1).padStart(2, '0')}
              </span>
              <Play size={12} className="hidden group-hover:block fill-black text-black" />
            </div>
            
            {track.album?.images?.[0]?.url && (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black truncate">{track.name}</p>
              <p className="text-xs text-black/40 truncate">{track.album?.name}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-black/30 tabular-nums">{track.popularity}</span>
            </div>
          </div>
        ))}
        
        {artistUri && (
           <button 
             onClick={() => onPlayContext(artistUri)}
             className="text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-wider px-2 pt-2 transition-colors outline-none"
           >
             {t('player.play')} {t('artistDetail.topTracks')}
           </button>
        )}
      </div>
    </section>
  )
}
