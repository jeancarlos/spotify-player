import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatDate'
import { useTranslation } from 'react-i18next'
import type { SpotifyAlbumSimple } from '@/types/spotify'

interface AlbumTableProps {
  albums: SpotifyAlbumSimple[]
  onClick: (album: SpotifyAlbumSimple) => void
}

export function AlbumTable({ albums, onClick }: AlbumTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 500 }}>
        <thead>
          <tr className="border-b border-black/8">
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-10"></th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">{t('common.name')}</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">{t('track.type')}</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">{t('track.releaseYear')}</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">{t('track.trackCount')}</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">{t('common.popularity')}</th>
          </tr>
        </thead>
        <tbody>
          {albums.map(album => (
            <tr
              key={album.id}
              className="group hover:bg-black/4 transition-colors cursor-pointer"
              onClick={() => onClick(album)}
            >
              <td className="py-2 px-3">
                <img
                  src={album.images[0]?.url}
                  alt=""
                  className="w-8 h-8 rounded-md object-cover"
                />
              </td>
              <td className="py-2 px-3 font-medium text-black/90 whitespace-nowrap max-w-[200px] truncate">
                {album.name}
              </td>
              <td className="py-2 px-3 text-black/50 capitalize">{album.album_type}</td>
              <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                {album.release_date ? formatDate(album.release_date, 'year') : ''}
              </td>
              <td className={cn('py-2 px-3 text-right text-black/40 tabular-nums')}>
                {album.total_tracks ?? '—'}
              </td>
              <td className="py-2 px-3 text-right text-black/40 tabular-nums">—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
