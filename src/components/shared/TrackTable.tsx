import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, pickImage, srcSetOf } from '@/lib/utils'
import { formatDuration } from '@/utils/formatDuration'
import { isPlayable } from '@/lib/deezerMappers'
import type { Image, Track } from '@/types/music'

interface TrackTableProps {
  tracks: Track[]
  showAlbumColumn?: boolean
  activeTrackId?: string
  startIndex?: number
  onPlay?: (track: Track, index: number) => void
  onAlbumClick?: (albumId: string) => void
}

interface TrackTableRowProps {
  track: Track
  index: number
  isActive: boolean
  showAlbumColumn: boolean
  showRank: boolean
  onPlay?: (track: Track, index: number) => void
  onAlbumClick?: (albumId: string) => void
}

function resolveTrackMeta(track: Track) {
  return {
    albumImages: track.album.images,
    albumId: track.album.id,
    albumName: track.album.name,
    artistNames: track.artists.map((a) => a.name).join(', '),
    rank: track.rank ?? '—',
  }
}

function AlbumThumb({ images }: { images: Image[] }) {
  return (
    <img
      src={pickImage(images, 32)?.url}
      srcSet={srcSetOf(images)}
      sizes="32px"
      loading="lazy"
      decoding="async"
      alt=""
      className="w-8 h-8 rounded-md object-cover shrink-0"
      style={{ minWidth: 32, minHeight: 32 }}
    />
  )
}

function TrackTableRow({
  track,
  index,
  isActive,
  showAlbumColumn,
  showRank,
  onPlay,
  onAlbumClick,
}: TrackTableRowProps) {
  const { t } = useTranslation()
  const { albumImages, albumId, albumName, artistNames, rank } = resolveTrackMeta(track)
  const playable = isPlayable(track)

  return (
    <tr
      className={cn(
        'group hover:bg-black/4 transition-colors',
        playable ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed',
        isActive && 'bg-black/6'
      )}
      aria-disabled={!playable || undefined}
      onClick={() => playable && onPlay?.(track, index)}
    >
      <td className="py-2 px-3 text-black/60 tabular-nums">
        <span className="group-hover:hidden group-focus-within:hidden">{index + 1}</span>
        <button
          className="sr-only group-hover:not-sr-only group-hover:flex group-focus-within:not-sr-only group-focus-within:flex items-center justify-center rounded disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
          disabled={!playable}
          aria-label={t('player.playTrack', { name: track.name })}
          onClick={(e) => {
            e.stopPropagation()
            onPlay?.(track, index)
          }}
        >
          <Play size={11} className="fill-black text-black" />
        </button>
      </td>
      <td className="py-2 px-3 w-10">
        <AlbumThumb images={albumImages} />
      </td>
      <td className="py-2 px-3 font-medium text-black/90 whitespace-nowrap max-w-[180px] truncate">
        {track.name}
        {!playable && <span className="sr-only">{t('track.noPreview')}</span>}
      </td>
      <td className="py-2 px-3 text-black/60 whitespace-nowrap">{artistNames}</td>
      {showAlbumColumn && (
        <td className="py-2 px-3 text-black/60 whitespace-nowrap">
          {albumId ? (
            <button
              className="hover:text-black hover:underline transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onAlbumClick?.(albumId)
              }}
            >
              {albumName}
            </button>
          ) : (
            '—'
          )}
        </td>
      )}
      <td className="py-2 px-3 text-right text-black/60 tabular-nums whitespace-nowrap">
        {formatDuration(track.duration_ms)}
      </td>
      {showRank && <td className="py-2 px-3 text-right text-black/60 tabular-nums">{rank}</td>}
      <td className="py-2 px-3 text-center">
        {track.explicit && (
          <span className="text-[8px] font-black bg-black/10 rounded px-1 py-0.5">E</span>
        )}
      </td>
    </tr>
  )
}

export function TrackTable({
  tracks,
  showAlbumColumn = true,
  activeTrackId,
  startIndex = 0,
  onPlay,
  onAlbumClick,
}: TrackTableProps) {
  const showRank = tracks.some((track) => track.rank != null)
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 560 }}>
        <thead>
          <tr className="border-b border-black/8">
            <th className="text-left py-2 px-3 text-black/60 font-semibold w-8">
              {t('track.trackNumber')}
            </th>
            <th className="text-left py-2 px-3 text-black/60 font-semibold w-10"></th>
            <th className="text-left py-2 px-3 text-black/60 font-semibold">{t('common.name')}</th>
            <th className="text-left py-2 px-3 text-black/60 font-semibold">
              {t('track.artistCol')}
            </th>
            {showAlbumColumn && (
              <th className="text-left py-2 px-3 text-black/60 font-semibold">
                {t('track.albumCol')}
              </th>
            )}
            <th className="text-right py-2 px-3 text-black/60 font-semibold">
              {t('track.duration')}
            </th>
            {showRank && (
              <th className="text-right py-2 px-3 text-black/60 font-semibold">
                {t('common.rank')}
              </th>
            )}
            <th className="text-center py-2 px-3 text-black/60 font-semibold">
              {t('track.explicit')}
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => (
            <TrackTableRow
              key={startIndex + i}
              track={track}
              index={startIndex + i}
              isActive={track.id === activeTrackId}
              showAlbumColumn={showAlbumColumn}
              showRank={showRank}
              onPlay={onPlay}
              onAlbumClick={onAlbumClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
