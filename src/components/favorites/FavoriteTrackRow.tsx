import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Trash2, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NoteField } from './NoteField'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface FavoriteTrackRowProps {
  track: SpotifyTrack
  note: string
  isActive: boolean
  onPlay: (track: SpotifyTrack) => void
  onRemove: (uri: string) => void
  onSaveNote: (uri: string, note: string) => void
}

export function FavoriteTrackRow({
  track,
  note,
  isActive,
  onPlay,
  onRemove,
  onSaveNote,
}: FavoriteTrackRowProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('rounded-xl transition-colors', isActive && 'bg-black/[0.04]')}>
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer group hover:bg-black/5 rounded-xl transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <img
          src={track.album.images[0]?.url}
          alt={track.album.name}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', isActive ? 'text-black' : 'text-black/80')}>
            {track.name}
          </p>
          <p className="text-xs text-black/40 truncate">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
        </div>

        <span className="text-xs text-black/30 shrink-0 tabular-nums">
          {formatDuration(track.duration_ms)}
        </span>

        <ChevronDown
          size={14}
          className={cn(
            'text-black/30 shrink-0 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2.5">
              <p className="text-[11px] text-black/30 truncate">
                {track.album.name} · {track.album.release_date?.slice(0, 4)}
              </p>

              <NoteField uri={track.uri} note={note} onSave={onSaveNote} />

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => onPlay(track)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-full text-xs font-medium hover:bg-black/80 transition-colors"
                  aria-label={t('player.playTrack', { name: track.name })}
                >
                  <Play size={11} className="fill-white" />
                  {t('player.play')}
                </button>

                <button
                  onClick={() => onRemove(track.uri)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-600 rounded-full text-xs font-medium hover:bg-red-50 transition-colors"
                  aria-label={t('favorites.removeConfirm')}
                >
                  <Trash2 size={11} />
                  {t('favorites.removeConfirm')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
