import { useState, useRef, useCallback } from 'react'
import { Music, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/contexts/PlayerContext'
import { useCatalogHealth } from '@/hooks/useCatalogHealth'
import { useFavorites } from '@/hooks/useFavorites'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/components/ui/toast'
import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'
import { TrackRow } from '@/components/shared/TrackRow'
import type { Track } from '@/types/music'

interface AddButtonProps {
  existingFavorites: Track[]
  onAdd: (track: Track, note?: string) => boolean
}

function AddButton({ existingFavorites, onAdd }: AddButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
  }, [])
  usePopoverDismiss(open, close, buttonRef, popoverRef)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setOpen((v) => !v)
        }}
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
            className="absolute top-[calc(100%+8px)] right-0 w-80 max-w-[calc(100vw-2rem)] glass bg-white/90 rounded-2xl shadow-xl z-30"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }}
            style={{ transformOrigin: 'top right' }}
          >
            <AddFavoriteForm existingFavorites={existingFavorites} onAdd={onAdd} onClose={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Favorites() {
  const { t } = useTranslation()
  const { state: playerState, controls } = usePlayer()
  const { toast } = useToast()
  const { unavailable } = useCatalogHealth()
  const { tracks, notes, addTrack, removeTrack, playlistName } = useFavorites()

  const handleAdd = (track: Track, note?: string) => {
    const ok = addTrack(track, note?.trim())
    if (!ok) toast(t('favorites.saveFailed'), 'error')
    return ok
  }

  const handleRemove = (uri: string) => {
    if (!removeTrack(uri)) toast(t('favorites.saveFailed'), 'error')
  }

  return (
    <div className="min-h-screen pt-16 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-6">
          <div>
            <h1
              className="text-2xl font-black text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('nav.favorites')}
            </h1>
            <div className="mt-0.5">
              <span className="text-sm text-black/60 font-medium">{playlistName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AddButton existingFavorites={tracks} onAdd={handleAdd} />
          </div>
        </div>

        {tracks.length === 0 && (
          <EmptyState message={t('favorites.emptyList')} icon={<Music size={32} />} />
        )}

        {tracks.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                note={notes[track.uri] ?? undefined}
                isActive={playerState.currentTrack?.uri === track.uri}
                onPlay={unavailable ? undefined : async (track) => controls.playTrack(track, tracks)}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
