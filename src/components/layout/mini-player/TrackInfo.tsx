import { useNavigate, useLocation } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { useTranslation } from 'react-i18next'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { formatDuration } from '@/utils/formatDuration'

interface TrackInfoProps {
  progress: number
}

export function TrackInfo({ progress }: TrackInfoProps) {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const isPlayerPage = location.pathname === '/player'
  const duration = currentTrack?.duration_ms || 0

  const handleTrackClick = () => {
    if (isPlayerPage) {
      navigate(location.state?.from ?? '/')
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
    <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden group/track">
      {/* Disco e Info Principal (Área de clique para o player) */}
      <div
        className="flex items-center gap-2.5 min-w-0 overflow-hidden cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${t('player.viewTrack')}: ${currentTrack.name}`}
      >
        <img
          src={currentTrack.album.images[0]?.url}
          alt={currentTrack.album.name}
          className="w-12 h-12 rounded-full"
          onClick={handleTrackClick}
          onKeyDown={handleEnterTrack}

        />
        <div className="min-w-0 flex flex-col justify-center">
          <button onClick={handleTrackClick}
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
                  onClick={() => navigate(`/artists/${a.id}`)}
                >
                  {a.name}{i < currentTrack.artists.length - 1 ? ', ' : ''}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate(`/albums/${currentTrack.album.id}`, { state: { from: location.pathname } })}
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
