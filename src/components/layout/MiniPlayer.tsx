import { usePlayer } from '@/hooks/usePlayer'
import { useTranslation } from 'react-i18next'

export function MiniPlayer() {
  const { state } = usePlayer()
  const { t } = useTranslation()

  return (
    <div className="glass-card-md h-20 flex items-center px-4 shrink-0 border-t border-white/5">
      {state.currentTrack ? (
        <div className="flex items-center gap-3">
          <img
            src={state.currentTrack.album.images[0]?.url}
            alt={state.currentTrack.album.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <p className="text-sm font-bold truncate max-w-[200px]">{state.currentTrack.name}</p>
            <p className="text-xs text-white/50 truncate max-w-[200px]">
              {state.currentTrack.artists.map(a => a.name).join(', ')}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/30">{t('player.nowPlaying')}</p>
      )}
    </div>
  )
}
