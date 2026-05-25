import { useNavigate, useLocation } from 'react-router-dom'
import { Info } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { useTranslation } from 'react-i18next'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { formatDuration } from '@/utils/formatDuration'
import { getFromPath } from '@/utils/routerState'

interface TrackInfoProps {
  progress: number
  notes: Record<string, string>
}

export function TrackInfo({ progress, notes }: TrackInfoProps) {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const isPlayerPage = location.pathname === '/player'
  const duration = currentTrack?.duration_ms ?? 0
  const personalNote = currentTrack ? (notes[currentTrack.uri] ?? '') : ''

  const handleTrackClick = () => {
    if (isPlayerPage) {
      navigate(getFromPath(location.state))
    } else if (currentTrack) {
      navigate('/player?tab=lyrics', { state: { from: location.pathname } })
    }
  }

  const handleEnterTrack = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleTrackClick()
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
      <div
        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${t('player.viewTrack')}: ${currentTrack.name}`}
      >
        <div className="relative shrink-0">
          {personalNote && (
            <div className="group/note absolute top-0 left-0 z-10">
              <button
                type="button"
                className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-black/60 hover:text-black transition-colors cursor-default"
                aria-label={personalNote}
                tabIndex={-1}
              >
                <Info size={12} />
              </button>
              <span className="absolute regular bottom-full left-0 mb-1.5 px-2 py-0.5 text-[10px] leading-snug bg-black/80 text-white rounded opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none z-50 w-max max-w-[200px]">
                {personalNote}
              </span>
            </div>
          )}
          <img
            src={currentTrack.album.images[0]?.url}
            alt={currentTrack.album.name}
            className="w-12 h-12 rounded-full"
            onClick={handleTrackClick}
            onKeyDown={handleEnterTrack}
          />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <button
            onClick={handleTrackClick}
            onKeyDown={handleEnterTrack}
            className="text-xs text-left font-bold text-black truncate hover:underline cursor-pointer"
            aria-label={`${t('player.viewTrack')}: ${currentTrack.name}`}
          >
            {currentTrack.name}
          </button>
          <div className="hidden min-[500px]:flex flex-col min-w-0 overflow-hidden">
            <div className="flex gap-1 overflow-hidden">
              {currentTrack.artists.map((a, i) => (
                <button
                  key={a.id}
                  className="truncate text-[11px] text-black/50 hover:text-black hover:underline cursor-pointer transition-colors outline-none focus:text-black focus:underline"
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
                navigate(`/albums/${currentTrack.album.id}`, { state: { from: location.pathname } })
              }}
              className="text-[10px] font-medium text-black/30 hover:text-black hover:underline truncate outline-none text-left w-fit"
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
