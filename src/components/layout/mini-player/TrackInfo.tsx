import { useNavigate, useLocation } from 'react-router-dom'
import { Info } from 'lucide-react'
import { usePlayer, useProgress } from '@/contexts/PlayerContext'
import { useTranslation } from 'react-i18next'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { pickImage, srcSetOf } from '@/lib/utils'
import { formatDuration } from '@/utils/formatDuration'
import { currentPath, getFromPath } from '@/utils/routerState'

interface TrackInfoProps {
  notes: Record<string, string>
}

export function TrackInfo({ notes }: TrackInfoProps) {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { progressMs: progress, durationMs: duration } = useProgress()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const isPlayerPage = location.pathname === '/player'
  const personalNote = currentTrack ? (notes[currentTrack.uri] ?? '') : ''

  const handleTrackClick = () => {
    if (isPlayerPage) {
      navigate(getFromPath(location.state))
    } else if (currentTrack) {
      navigate('/player?tab=lyrics', { state: { from: currentPath(location) } })
    }
  }

  if (!currentTrack) {
    return (
      <div className="flex items-center gap-2 w-full cursor-default flex-1">
        <VinylDisk size="xs" albumArt={undefined} />
        <p className="text-xs text-black/70">{t('player.noTrack')}</p>
      </div>
    )
  }

  return (
    <div className="flex ml-[-5px] items-center gap-2.5 flex-1 min-w-0  group/track">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          {personalNote && (
            <div className="group/note absolute top-0 left-0 z-10">
              <button
                type="button"
                className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-black/60 hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
                aria-label={personalNote}
              >
                <Info size={12} />
              </button>
              <span
                aria-hidden="true"
                className="absolute regular bottom-full left-0 mb-1.5 px-2 py-0.5 text-[10px] leading-snug bg-black/80 text-white rounded opacity-0 group-hover/note:opacity-100 group-focus-within/note:opacity-100 transition-opacity pointer-events-none z-50 w-max max-w-[200px]"
              >
                {personalNote}
              </span>
            </div>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={handleTrackClick}
            className="block rounded-full focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
          >
            <img
              src={pickImage(currentTrack.album.images, 48)?.url}
              srcSet={srcSetOf(currentTrack.album.images)}
              sizes="48px"
              decoding="async"
              alt=""
              className="w-12 h-12 rounded-full"
            />
          </button>
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <button
            onClick={handleTrackClick}
            className="text-xs text-left font-bold text-black truncate hover:underline cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
            aria-label={`${t('player.viewTrack')}: ${currentTrack.name}`}
          >
            {currentTrack.name}
          </button>
          <div className="hidden min-[500px]:flex flex-col min-w-0 overflow-hidden">
            <div className="flex gap-1 overflow-hidden">
              {currentTrack.artists.map((a, i) => (
                <button
                  key={a.id}
                  className="truncate text-[11px] text-black/50 hover:text-black hover:underline cursor-pointer transition-colors outline-none rounded focus:text-black focus:underline focus-visible:ring-2 focus-visible:ring-black/40"
                  onClick={() => {
                    navigate(`/artists/${a.id}`)
                  }}
                >
                  {a.name}
                  {i < currentTrack.artists.length - 1 ? ', ' : ''}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                navigate(`/albums/${currentTrack.album.id}`, {
                  state: { from: currentPath(location) },
                })
              }}
              className="text-[10px] font-medium text-black/30 hover:text-black hover:underline truncate outline-none rounded text-left w-fit focus-visible:ring-2 focus-visible:ring-black/40"
            >
              {currentTrack.album.name}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 ml-auto pr-2" aria-hidden="true">
        <span className="text-[10px] font-mono shrink-0 tabular-nums">
          {formatDuration(progress)}
        </span>
        <span className="text-[10px] font-mono shrink-0 tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>
    </div>
  )
}
