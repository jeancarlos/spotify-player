import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Trash2, X } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { FavoriteTrackFormSchema, type FavoriteTrackForm } from '@/types/favorites'
import { GlassCard } from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Favorites() {
  const { t } = useTranslation()
  const { favorites, add, remove, search } = useFavorites()
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FavoriteTrackForm>({ resolver: zodResolver(FavoriteTrackFormSchema) })

  function onSubmit(data: FavoriteTrackForm) {
    add(data)
    reset()
  }

  const displayed = searchQuery.trim() ? search(searchQuery) : favorites

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
          {t('favorites.addHeading')}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label htmlFor="title" className="text-xs text-white/50 mb-1 block">
              {t('favorites.title')} *
            </label>
            <input
              id="title"
              {...register('title')}
              placeholder={t('favorites.title')}
              className={cn(
                'glass-input w-full px-3 py-2 text-sm rounded-xl text-white',
                errors.title && 'ring-red-400/60'
              )}
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">{t('favorites.titleRequired')}</p>
            )}
          </div>

          <div>
            <label htmlFor="artist" className="text-xs text-white/50 mb-1 block">
              {t('favorites.artist')} *
            </label>
            <input
              id="artist"
              {...register('artist')}
              placeholder={t('favorites.artist')}
              className={cn(
                'glass-input w-full px-3 py-2 text-sm rounded-xl text-white',
                errors.artist && 'ring-red-400/60'
              )}
            />
            {errors.artist && (
              <p className="text-red-400 text-xs mt-1">{t('favorites.artistRequired')}</p>
            )}
          </div>

          <div>
            <label htmlFor="album" className="text-xs text-white/50 mb-1 block">
              {t('favorites.album')}
            </label>
            <input
              id="album"
              {...register('album')}
              placeholder={t('favorites.album')}
              className="glass-input w-full px-3 py-2 text-sm rounded-xl text-white"
            />
          </div>

          <div>
            <label htmlFor="note" className="text-xs text-white/50 mb-1 block">
              {t('favorites.note')}
            </label>
            <textarea
              id="note"
              {...register('note')}
              rows={2}
              placeholder={t('favorites.note')}
              className="glass-input w-full px-3 py-2 text-sm rounded-xl text-white resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            {t('favorites.addButton')}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('favorites.searchPlaceholder')}
          className="glass-input w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder:text-white/30"
        />

        {displayed.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-12">{t('favorites.emptyList')}</p>
        ) : (
          <div className="space-y-3">
            {displayed.map(fav => (
              <GlassCard key={fav.id} className="flex items-start justify-between gap-3 p-4">
                <div className="overflow-hidden flex-1">
                  <p className="font-bold text-sm truncate">{fav.title}</p>
                  <p className="text-xs text-white/60 truncate">{fav.artist}</p>
                  {fav.album && <p className="text-xs text-white/40 truncate">{fav.album}</p>}
                  {fav.note && (
                    <p className="text-xs text-white/30 mt-1 italic truncate">{fav.note}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {confirmId === fav.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          remove(fav.id)
                          setConfirmId(null)
                        }}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded glass-button"
                      >
                        {t('favorites.removeConfirm')}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-white/40 hover:text-white text-xs px-2 py-1 rounded glass-button"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(fav.id)}
                      className="text-white/30 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
