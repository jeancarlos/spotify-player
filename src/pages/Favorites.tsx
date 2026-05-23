import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Plus, Trash2, X, Music } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { useSearchTracks } from '@/hooks/queries/useSearchTracks'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { TrackRow } from '@/components/shared/TrackRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tooltip } from '@/components/shared/Tooltip'
import type { SpotifyTrack } from '@/types/spotify'

export function Favorites() {
  const { t } = useTranslation()
  const { tracks, addTrack, removeTrack, isLoading, playlistId, playlistName } = useSpoterPlaylist()
  const playTrack = usePlayTrack()
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)

  const buttonRef  = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const searchSchema = useMemo(() => z.object({
    query: z.string().min(2, t('favorites.minQuery')),
  }), [t])

  type SearchForm = z.infer<typeof searchSchema>

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  })

  const close = useCallback(() => {
    setOpen(false)
    setSearchQuery('')
    reset()
  }, [reset])

  const searchResults = useSearchTracks(searchQuery, searchQuery.length >= 2)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current  && !buttonRef.current.contains(e.target as Node)
      ) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Fecha no Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  const onSubmit = (data: SearchForm) => setSearchQuery(data.query)

  const handleAdd = (track: SpotifyTrack) => {
    addTrack(track.uri)
    close()
  }

  return (
    <div className="min-h-screen pt-16 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <div>
            <h1 className="text-2xl font-black text-black">{t('nav.favorites')}</h1>
            <div className="mt-0.5">
              {playlistId ? (
                <Tooltip content={t('favorites.viewOnSpotify')}>
                  <a
                    href={`https://open.spotify.com/playlist/${playlistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black/40 font-medium hover:text-black/70 hover:underline transition-colors"
                  >
                    {playlistName}
                  </a>
                </Tooltip>
              ) : (
                <span className="text-sm text-black/40 font-medium">{playlistName}</span>
              )}
            </div>
          </div>

          {/* Botão + Popover */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                    <X size={16} />
                  </motion.span>
                ) : (
                  <motion.span key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                    <Plus size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
              {open ? t('favorites.close') : t('favorites.addButton')}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  ref={popoverRef}
                  className="absolute top-[calc(100%+8px)] right-0 w-80 glass rounded-2xl shadow-xl overflow-hidden z-30"
                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }}
                  style={{ transformOrigin: 'top right' }}
                >
                  <div className="p-4">
                    <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-3">
                      {t('favorites.addButton')}
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <input
                          {...register('query')}
                          autoFocus
                          placeholder={t('favorites.searchAddPlaceholder')}
                          className="w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors"
                        />
                        {errors.query && (
                          <p className="text-xs text-red-500 mt-1 ml-1">{errors.query.message}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-2 bg-black text-white rounded-xl text-sm hover:bg-black/80 transition-colors"
                      >
                        <Search size={15} />
                      </button>
                    </form>

                    {searchResults.isPending && searchQuery && (
                      <p className="text-xs text-black/40 text-center py-3">{t('common.loading')}</p>
                    )}
                    {searchResults.data?.length === 0 && searchQuery && (
                      <p className="text-xs text-red-500 text-center py-3">{t('favorites.notFound')}</p>
                    )}
                    {searchResults.data && searchResults.data.length > 0 && (
                      <div className="space-y-0.5 max-h-64 overflow-y-auto">
                        {searchResults.data.map(track => (
                          <div
                            key={track.id}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-black/5 transition-colors"
                          >
                            <img
                              src={track.album.images[0]?.url}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                              alt={track.album.name}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-black truncate">{track.name}</p>
                              <p className="text-[11px] text-black/50 truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAdd(track)}
                              className="p-1.5 rounded-lg bg-black text-white hover:bg-black/80 transition-colors shrink-0"
                              aria-label={t('favorites.addTrack')}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Lista da playlist */}
        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-black/10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3 rounded-full bg-black/10" style={{ width: `${55 + (i * 17) % 35}%` }} />
                  <div className="h-2.5 rounded-full bg-black/[0.06]" style={{ width: `${30 + (i * 11) % 25}%` }} />
                </div>
                <div className="w-7 h-3 rounded-full bg-black/[0.06] shrink-0" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && tracks.length === 0 && (
          <EmptyState message={t('favorites.emptyList')} icon={<Music size={32} />} />
        )}

        {!isLoading && tracks.length > 0 && (
          <div className="space-y-1">
            {tracks.map(track => (
              <div key={track.id} className="flex items-center group">
                <div className="flex-1">
                  <TrackRow track={track} isActive={false} onPlay={playTrack} />
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
