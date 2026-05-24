import { useState, useRef, useEffect, useCallback } from 'react'
import { Music, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tooltip } from '@/components/shared/Tooltip'
import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'
import { TrackRow } from '@/components/shared/TrackRow'
import { TrackRowSkeleton } from '@/components/shared/TrackRowSkeleton'

export function Favorites() {
  const { t } = useTranslation()
  const { state: playerState } = usePlayer()
  const { tracks, notes, addTrack, removeTrack, isLoading, playlistId, playlistName } =
    useSpoterPlaylist()
  const playTrack = usePlayTrack()
  const [open, setOpen] = useState(false)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

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

        {isLoading && <TrackRowSkeleton count={6} />}

        {!isLoading && tracks.length === 0 && (
          <EmptyState message={t('favorites.emptyList')} icon={<Music size={32} />} />
        )}

        {!isLoading && tracks.length > 0 && (
          <div className="space-y-0.5">
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                note={notes[track.uri] || undefined}
                isActive={playerState.currentTrack?.uri === track.uri}
                onPlay={playTrack}
                onRemove={removeTrack}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
