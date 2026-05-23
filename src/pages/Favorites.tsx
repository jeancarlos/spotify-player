import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { useSearchTracks } from '@/hooks/queries/useSearchTracks'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { TrackRow } from '@/components/shared/TrackRow'
import type { SpotifyTrack } from '@/types/spotify'

const SearchSchema = z.object({
  query: z.string().min(2, 'Digite pelo menos 2 caracteres'),
})
type SearchForm = z.infer<typeof SearchSchema>

export function Favorites() {
  const { t } = useTranslation()
  const { tracks, addTrack, removeTrack, isLoading } = useSpoterPlaylist()
  const playTrack = usePlayTrack()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SearchForm>({ resolver: zodResolver(SearchSchema) })

  const searchResults = useSearchTracks(searchQuery, searchQuery.length >= 2)

  const onSubmit = (data: SearchForm) => {
    setSearchQuery(data.query)
  }

  const handleAdd = (track: SpotifyTrack) => {
    addTrack(track.uri)
    setShowForm(false)
    setSearchQuery('')
    reset()
  }

  return (
    <div className="min-h-screen bg-white pt-16 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <h1 className="text-2xl font-black text-black">Spoter List</h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Fechar' : t('favorites.addButton')}
          </button>
        </div>

        {/* Formulário de busca */}
        {showForm && (
          <div className="glass-card p-5 mb-6">
            <h2 className="text-sm font-bold text-black mb-4">{t('favorites.addButton')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-4">
              <div className="flex-1">
                <input
                  {...register('query')}
                  placeholder={`${t('favorites.title')} ou artista...`}
                  className="w-full px-4 py-2.5 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors"
                />
                {errors.query && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.query.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition-colors"
              >
                <Search size={16} />
              </button>
            </form>

            {/* Resultados da busca */}
            {searchResults.isPending && searchQuery && (
              <p className="text-xs text-black/40 text-center py-3">{t('common.loading')}</p>
            )}
            {searchResults.data?.length === 0 && searchQuery && (
              <p className="text-xs text-red-500 text-center py-3">{t('favorites.notFound')}</p>
            )}
            {searchResults.data && searchResults.data.length > 0 && (
              <div className="space-y-1">
                {searchResults.data.map(track => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <img
                      src={track.album.images[0]?.url}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                      alt={track.album.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{track.name}</p>
                      <p className="text-xs text-black/50 truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(track)}
                      className="px-3 py-1 bg-black text-white rounded-full text-xs font-medium hover:bg-black/80 transition-colors shrink-0"
                    >
                      + Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista da playlist */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 glass-card animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && tracks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-black/30">{t('favorites.emptyList')}</p>
          </div>
        )}

        {!isLoading && tracks.length > 0 && (
          <div className="space-y-1">
            {tracks.map(track => (
              <div key={track.id} className="flex items-center group">
                <div className="flex-1">
                  <TrackRow
                    track={track}
                    isActive={false}
                    onPlay={playTrack}
                  />
                </div>
                <button
                  onClick={() => removeTrack(track.uri)}
                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                  aria-label={t('favorites.removeConfirm')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
