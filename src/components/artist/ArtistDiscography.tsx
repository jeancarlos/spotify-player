import { useTranslation } from 'react-i18next'
import { AlbumTable } from '@/components/shared/AlbumTable'
import { ListTableSwitch, type ViewMode } from '@/components/shared/ListTableSwitch'
import { Pagination } from '@/components/shared/Pagination'
import { formatDate } from '@/utils/formatDate'
import type { SpotifyAlbumSimple } from '@/types/spotify'

interface ArtistDiscographyProps {
  albums: SpotifyAlbumSimple[]
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  onAlbumClick: (album: SpotifyAlbumSimple) => void
  page: number
  hasNext: boolean
  onPrevPage: () => void
  onNextPage: () => void
}

export function ArtistDiscography({
  albums,
  view,
  onViewChange,
  onAlbumClick,
  page,
  hasNext,
  onPrevPage,
  onNextPage,
}: ArtistDiscographyProps) {
  const { t } = useTranslation()

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between px-2 mb-3">
        <h3 className="text-sm font-bold text-black/50">{t('artistDetail.discography')}</h3>
        <ListTableSwitch view={view} onChange={onViewChange} />
      </div>

      {view === 'table' ? (
        <AlbumTable albums={albums} onClick={onAlbumClick} />
      ) : (
        <div className="space-y-1">
          {albums.map((album) => (
            <div
              key={album.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group focus:outline-none focus:bg-black/5"
              onClick={() => {
                onAlbumClick(album)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onAlbumClick(album)
                }
              }}
            >
              <img
                src={album.images[0]?.url}
                alt={album.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-black truncate">{album.name}</p>
                <p className="text-xs text-black/40">
                  {album.release_date ? formatDate(album.release_date, 'year') : ''}
                </p>
              </div>
              <span className="text-xs text-black/30 shrink-0 capitalize">{album.album_type}</span>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        hasNext={hasNext}
        onPrev={onPrevPage}
        onNext={onNextPage}
        className="mt-4"
      />
    </section>
  )
}
