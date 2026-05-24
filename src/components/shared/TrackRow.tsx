import { Play, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/shared/Tooltip'
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

interface TrackTheme {
  row: string
  number: string
  icon: string
  text: string
  subtext: string
  duration: string
  remove: string
}

function resolveTextColor(dark: boolean, isActive: boolean): string {
  if (dark) return isActive ? 'text-white' : 'text-white/80'
  return isActive ? 'text-black' : 'text-black/80'
}

function buildTrackTheme(dark: boolean, isActive: boolean): TrackTheme {
  return {
    row: cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group focus:outline-none',
      dark
        ? cn('hover:bg-white/5', isActive && 'bg-white/10')
        : cn('hover:bg-black/5', isActive && 'bg-black/[0.04]')
    ),
    number: cn(
      'text-xs font-bold tabular-nums group-hover:hidden',
      dark ? 'text-white/30' : 'text-black/30'
    ),
    icon: dark ? 'fill-white text-white' : 'fill-black text-black',
    text: cn('text-sm font-medium truncate', resolveTextColor(dark, isActive)),
    subtext: cn('text-xs truncate', dark ? 'text-white/40' : 'text-black/40'),
    duration: cn('text-xs tabular-nums shrink-0', dark ? 'text-white/20' : 'text-black/30'),
    remove: cn(
      'p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 focus:outline-none focus:opacity-100',
      dark ? 'text-white/30 hover:text-red-400' : 'text-black/30 hover:text-red-500'
    ),
  }
}

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

interface NameAreaProps {
  track: SpotifyTrack | SpotifyAlbumTrack
  note?: string
  theme: TrackTheme
  artistNames: string
}

function NameArea({ track, note, theme: s, artistNames }: NameAreaProps) {
  const nameBlock = (
    <>
      <p className={s.text}>{track.name}</p>
      <p className={s.subtext}>{artistNames}</p>
    </>
  )
  if (note) {
    return (
      <Tooltip content={note} align="start" maxWidth="max-w-xs" className="flex-1 min-w-0 block">
        {nameBlock}
      </Tooltip>
    )
  }
  return <div className="flex-1 min-w-0">{nameBlock}</div>
}

interface PlayCellProps {
  trackName: string
  index?: number
  theme: TrackTheme
  onPlay?: (track: SpotifyTrack | SpotifyAlbumTrack) => void
  track: SpotifyTrack | SpotifyAlbumTrack
}

function PlayCell({ trackName, index, theme: s, onPlay, track }: PlayCellProps) {
  const { t } = useTranslation()
  return (
    <button
      className="w-6 shrink-0 flex items-center justify-center focus:outline-none"
      aria-label={t('player.playTrack', { name: trackName })}
      onClick={(e) => { e.stopPropagation(); onPlay?.(track) }}
    >
      {index !== undefined ? (
        <>
          <span className={s.number}>{String(index + 1).padStart(2, '0')}</span>
          <Play size={12} className={cn('hidden group-hover:block', s.icon)} />
        </>
      ) : (
        <Play size={12} className={s.icon} />
      )}
    </button>
  )
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
  const s = buildTrackTheme(theme === 'dark', isActive)

  const albumImage = 'album' in track ? track.album.images[0]?.url : undefined
  const artistNames = 'artists' in track ? track.artists.map((a) => a.name).join(', ') : ''

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isActivationKey(e.key)) {
      e.preventDefault()
      onPlay?.(track)
    }
  }

  return (
    <div className={s.row}>
      <PlayCell
        trackName={track.name}
        index={index}
        theme={s}
        onPlay={onPlay}
        track={track}
      />

      <div
        className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer"
        onClick={() => onPlay?.(track)}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {albumImage && (
          <img src={albumImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
        )}
        <NameArea track={track} note={note} theme={s} artistNames={artistNames} />
      </div>

      <span className={s.duration}>{formatDuration(track.duration_ms)}</span>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(track.uri)
          }}
          aria-label={t('favorites.removeConfirm')}
          className={s.remove}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
