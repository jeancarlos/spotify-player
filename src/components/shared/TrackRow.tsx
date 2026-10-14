import { Play, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn, pickImage, srcSetOf } from '@/lib/utils'
import { Tooltip } from '@/components/shared/Tooltip'
import { isPlayable } from '@/lib/deezerMappers'
import type { Track } from '@/types/music'

interface TrackRowProps {
  track: Track
  isActive?: boolean
  onPlay?: (track: Track) => void
  onRemove?: (uri: string) => void
  disableRemove?: boolean
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
  area: string
}

function resolveTextColor(dark: boolean, isActive: boolean): string {
  if (dark) return isActive ? 'text-white' : 'text-white/80'
  return isActive ? 'text-black' : 'text-black/80'
}

function focusRing(dark: boolean): string {
  return dark
    ? 'focus-visible:ring-2 focus-visible:ring-white/60'
    : 'focus-visible:ring-2 focus-visible:ring-black/40'
}

function buildTrackTheme(dark: boolean, isActive: boolean): TrackTheme {
  return {
    row: cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group',
      dark
        ? cn('hover:bg-white/5', isActive && 'bg-white/10')
        : cn('hover:bg-black/5', isActive && 'bg-primary/10')
    ),
    area: cn(
      'flex-1 min-w-0 flex items-center gap-3 rounded-xl outline-none group/tipfocus',
      focusRing(dark)
    ),
    number: cn(
      'text-xs font-bold tabular-nums group-hover:hidden',
      dark ? 'text-white/60' : 'text-black/60'
    ),
    icon: dark ? 'fill-white text-white' : 'fill-black text-black',
    text: cn('text-sm font-medium truncate', resolveTextColor(dark, isActive)),
    subtext: cn('text-xs truncate', dark ? 'text-white/60' : 'text-black/60'),
    duration: cn('text-xs tabular-nums shrink-0', dark ? 'text-white/60' : 'text-black/60'),
    remove: cn(
      'p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 outline-none focus:opacity-100',
      focusRing(dark),
      dark ? 'text-white/60 hover:text-red-400' : 'text-black/60 hover:text-red-500'
    ),
  }
}

function playableClasses(playable: boolean) {
  return {
    row: playable ? '' : 'opacity-40 cursor-not-allowed',
    area: playable ? 'cursor-pointer' : 'cursor-not-allowed',
  }
}

function resolveMeta(track: Track) {
  return {
    albumImages: 'album' in track ? track.album.images : undefined,
    artistNames: 'artists' in track ? track.artists.map((a) => a.name).join(', ') : '',
  }
}

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

interface NameAreaProps {
  track: Track
  note?: string
  theme: TrackTheme
  artistNames: string
}

function NameArea({ track, note, theme: styles, artistNames }: NameAreaProps) {
  const nameBlock = (
    <>
      <p className={styles.text}>{track.name}</p>
      <p className={styles.subtext}>{artistNames}</p>
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
  onPlay?: (track: Track) => void
  track: Track
}

function PlayCell({ trackName, index, theme: styles, onPlay, track }: PlayCellProps) {
  const { t } = useTranslation()
  return (
    <button
      className="w-6 shrink-0 flex items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-black/40 disabled:cursor-not-allowed"
      disabled={!onPlay}
      aria-label={t('player.playTrack', { name: trackName })}
      onClick={(e) => {
        e.stopPropagation()
        onPlay?.(track)
      }}
    >
      {index !== undefined ? (
        <>
          <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
          <Play size={12} className={cn('hidden group-hover:block', styles.icon)} />
        </>
      ) : (
        <Play size={12} className={styles.icon} />
      )}
    </button>
  )
}

export function TrackRow({
  track,
  isActive = false,
  onPlay,
  onRemove,
  disableRemove,
  note,
  index,
  theme = 'light',
}: TrackRowProps) {
  const { t } = useTranslation()
  const styles = buildTrackTheme(theme === 'dark', isActive)
  const playable = isPlayable(track)
  const play = playable ? onPlay : undefined
  const cls = playableClasses(playable)

  const { albumImages, artistNames } = resolveMeta(track)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isActivationKey(e.key)) {
      e.preventDefault()
      play?.(track)
    }
  }

  return (
    <div className={cn(styles.row, cls.row)}>
      <PlayCell trackName={track.name} index={index} theme={styles} onPlay={play} track={track} />

      <div
        className={cn(styles.area, cls.area)}
        onClick={() => play?.(track)}
        role="button"
        aria-disabled={!playable || undefined}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {albumImages && (
          <img
            src={pickImage(albumImages, 36)?.url}
            srcSet={srcSetOf(albumImages)}
            sizes="36px"
            loading="lazy"
            decoding="async"
            alt=""
            className="w-9 h-9 rounded-lg object-cover shrink-0"
          />
        )}
        <NameArea track={track} note={note} theme={styles} artistNames={artistNames} />
        {!playable && <span className="sr-only">{t('track.noPreview')}</span>}
      </div>

      <span className={styles.duration}>{formatDuration(track.duration_ms)}</span>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!disableRemove) onRemove(track.uri)
          }}
          disabled={disableRemove}
          aria-label={t('favorites.removeConfirm')}
          className={cn(
            styles.remove,
            disableRemove && 'cursor-not-allowed opacity-50 group-hover:opacity-50'
          )}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
