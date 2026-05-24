import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/formatDuration'
import type { SpotifyTrack, SpotifyAlbumTrack } from '@/types/spotify'

interface TrackTableProps {
  tracks: (SpotifyTrack | SpotifyAlbumTrack)[]
  showAlbumColumn?: boolean
  activeTrackId?: string
  onPlay?: (track: SpotifyTrack | SpotifyAlbumTrack) => void
  onAlbumClick?: (albumId: string) => void
}

export function TrackTable({
  tracks,
  showAlbumColumn = true,
  activeTrackId,
  onPlay,
  onAlbumClick,
}: TrackTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 560 }}>
        <thead>
          <tr className="border-b border-black/8">
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-8">#</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-10"></th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">Nome</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">Artista</th>
            {showAlbumColumn && (
              <th className="text-left py-2 px-3 text-black/30 font-semibold">Álbum</th>
            )}
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Duração</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Pop.</th>
            <th className="text-center py-2 px-3 text-black/30 font-semibold">E</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => {
            const albumImage = 'album' in track ? track.album.images[0]?.url : undefined
            const albumId = 'album' in track ? track.album.id : undefined
            const isActive = track.id === activeTrackId

            return (
              <tr
                key={track.id}
                className={cn(
                  'group hover:bg-black/4 transition-colors cursor-pointer',
                  isActive && 'bg-black/6'
                )}
                onClick={() => onPlay?.(track)}
              >
                <td className="py-2 px-3 text-black/30 tabular-nums">
                  <span className="group-hover:hidden">{i + 1}</span>
                  <button
                    className="hidden group-hover:flex items-center justify-center"
                    aria-label={`Tocar ${track.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlay?.(track)
                    }}
                  >
                    <Play size={11} className="fill-black text-black" />
                  </button>
                </td>
                <td className="py-2 px-3 w-10">
                  {albumImage && (
                    <img
                      src={albumImage}
                      alt=""
                      className="w-8 h-8 rounded-md object-cover shrink-0"
                      style={{ minWidth: 32, minHeight: 32 }}
                    />
                  )}
                </td>
                <td className="py-2 px-3 font-medium text-black/90 whitespace-nowrap max-w-[180px] truncate">
                  {track.name}
                </td>
                <td className="py-2 px-3 text-black/50 whitespace-nowrap">
                  {'artists' in track ? track.artists.map((a) => a.name).join(', ') : '—'}
                </td>
                {showAlbumColumn && (
                  <td className="py-2 px-3 text-black/50 whitespace-nowrap">
                    {albumId ? (
                      <button
                        className="hover:text-black hover:underline transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAlbumClick?.(albumId)
                        }}
                      >
                        {'album' in track ? track.album.name : '—'}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                <td className="py-2 px-3 text-right text-black/40 tabular-nums whitespace-nowrap">
                  {formatDuration(track.duration_ms)}
                </td>
                <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                  {'popularity' in track ? track.popularity : '—'}
                </td>
                <td className="py-2 px-3 text-center">
                  {track.explicit && (
                    <span className="text-[8px] font-black bg-black/10 rounded px-1 py-0.5">E</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
