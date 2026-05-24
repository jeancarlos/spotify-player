import { useState, useRef, useEffect, useCallback } from 'react'
import { Music, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useFavorites } from '@/contexts/FavoritesContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tooltip } from '@/components/shared/Tooltip'
import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'
import { FavoriteTrackRow } from '@/components/favorites/FavoriteTrackRow'

export function Favorites() {
  const { t } = useTranslation()
  const { state: playerState } = usePlayer()
  const { tracks, notes, addTrack, removeTrack, updateNote, isLoading, playlistId, playlistName } =
    useFavorites()
  const playTrack = usePlayTrack()
  const [open, setOpen] = useState(false)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  // Fecha o popover ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      )
        close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Fecha o popover com Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <div className="min-h-screen pt-16 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho com título e botão de adicionar */}
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

          {/* Botão Adicionar + Popover com AddFavoriteForm */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex' }}
                  >
                    <X size={16} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="plus"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex' }}
                  >
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
                  <AddFavoriteForm tracks={tracks} onAdd={addTrack} onClose={close} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skeleton exibido enquanto carrega a playlist */}
        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-black/10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div
                    className="h-3 rounded-full bg-black/10"
                    style={{ width: `${55 + ((i * 17) % 35)}%` }}
                  />
                  <div
                    className="h-2.5 rounded-full bg-black/[0.06]"
                    style={{ width: `${30 + ((i * 11) % 25)}%` }}
                  />
                </div>
                <div className="w-7 h-3 rounded-full bg-black/[0.06] shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Estado vazio após carregamento */}
        {!isLoading && tracks.length === 0 && (
          <EmptyState message={t('favorites.emptyList')} icon={<Music size={32} />} />
        )}

        {/* Lista de faixas favoritas */}
        {!isLoading && tracks.length > 0 && (
          <div className="space-y-0.5">
            {tracks.map((track) => (
              <FavoriteTrackRow
                key={track.id}
                track={track}
                note={notes[track.uri] ?? ''}
                isActive={playerState.currentTrack?.uri === track.uri}
                onPlay={playTrack}
                onRemove={removeTrack}
                onSaveNote={updateNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
