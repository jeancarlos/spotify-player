import { Play, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import type { SpotifyTrack, SpotifyAlbumTrack } from '@/types/spotify'

interface TrackRowProps {
  track: SpotifyTrack | SpotifyAlbumTrack
  isActive?: boolean
  onPlay?: (track: SpotifyTrack | SpotifyAlbumTrack) => void
  onRemove?: (uri: string) => void
  note?: string
  index?: number
  theme?: 'light' | 'dark'
}

export function TrackRow({
  track,
  isActive = false,
  onPlay,
  onRemove,
  note,
  index,
  theme = 'light',
}: TrackRowProps) {
  const { t } = useTranslation()
  const dark = theme === 'dark'

  const albumImage = 'album' in track ? track.album.images[0]?.url : undefined
  const artistNames = 'artists' in track ? track.artists.map((a) => a.name).join(', ') : ''

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group focus:outline-none',
        dark
          ? cn('hover:bg-white/5', isActive && 'bg-white/10')
          : cn('hover:bg-black/5', isActive && 'bg-black/[0.04]')
      )}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay?.(track)
        }
      }}
    >
      {/* Play icon / index number */}
      <button
        className="w-6 shrink-0 flex items-center justify-center focus:outline-none"
        aria-label={t('player.playTrack', { name: track.name })}
        onClick={(e) => { e.stopPropagation(); onPlay?.(track) }}
      >
        {index !== undefined ? (
          <>
            <span className={cn(
              'text-xs font-bold tabular-nums group-hover:hidden',
              dark ? 'text-white/30' : 'text-black/30'
            )}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <Play size={12} className={cn(
              'hidden group-hover:block',
              dark ? 'fill-white text-white' : 'fill-black text-black'
            )} />
          </>
        ) : (
          <Play size={12} className={dark ? 'fill-white text-white' : 'fill-black text-black'} />
        )}
      </button>

      {/* Album cover */}
      {albumImage && (
        <img
          src={albumImage}
          alt=""
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
      )}

      {/* Name + artist — note tooltip anchored here */}
      <div className="flex-1 min-w-0 relative">
        <p className={cn(
          'text-sm font-medium truncate',
          dark
            ? isActive ? 'text-white' : 'text-white/80'
            : isActive ? 'text-black' : 'text-black/80'
        )}>
          {track.name}
        </p>
        <p className={cn('text-xs truncate', dark ? 'text-white/40' : 'text-black/40')}>
          {artistNames}
        </p>
        {note && (
          <span className="pointer-events-none absolute bottom-full left-0 mb-1 whitespace-normal w-max max-w-xs rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {note}
          </span>
        )}
      </div>

      {/* Duration */}
      <span className={cn(
        'text-xs tabular-nums shrink-0',
        dark ? 'text-white/20' : 'text-black/30'
      )}>
        {formatDuration(track.duration_ms)}
      </span>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(track.uri) }}
          aria-label={t('favorites.removeConfirm')}
          className={cn(
            'p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 focus:outline-none focus:opacity-100',
            dark ? 'text-white/30 hover:text-red-400' : 'text-black/30 hover:text-red-500'
          )}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
