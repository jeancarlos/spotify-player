import { pickImage, srcSetOf } from '@/lib/utils'
import { formatDate } from '@/utils/formatDate'
import { useTranslation } from 'react-i18next'
import type { AlbumSimple } from '@/types/music'

interface AlbumTableProps {
  albums: AlbumSimple[]
  onClick: (album: AlbumSimple) => void
}

export function AlbumTable({ albums, onClick }: AlbumTableProps) {
  const { t } = useTranslation()
  const showTrackCount = albums.some((album) => album.total_tracks != null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 500 }}>
        <thead>
          <tr className="border-b border-black/8">
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-10"></th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">{t('common.name')}</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">{t('track.type')}</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">
              {t('track.releaseYear')}
            </th>
            {showTrackCount && (
              <th className="text-right py-2 px-3 text-black/30 font-semibold">
                {t('track.trackCount')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {albums.map((album) => (
            <tr
              key={album.id}
              className="group hover:bg-black/4 transition-colors cursor-pointer"
              onClick={() => {
                onClick(album)
              }}
            >
              <td className="py-2 px-3">
                <img
                  src={pickImage(album.images, 32)?.url}
                  srcSet={srcSetOf(album.images)}
                  sizes="32px"
                  loading="lazy"
                  decoding="async"
                  alt=""
                  className="w-8 h-8 rounded-md object-cover"
                />
              </td>
              <td className="py-2 px-3 font-medium text-black/90 whitespace-nowrap max-w-[200px] truncate">
                <button
                  type="button"
                  className="max-w-full truncate text-left rounded focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick(album)
                  }}
                >
                  {album.name}
                </button>
              </td>
              <td className="py-2 px-3 text-black/50 capitalize">{album.album_type}</td>
              <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                {album.release_date ? formatDate(album.release_date, 'year') : ''}
              </td>
              {showTrackCount && (
                <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                  {album.total_tracks ?? '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
