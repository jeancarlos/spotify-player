import { useCallback } from 'react'
import { Heart } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'
import { ControlTip } from './PlaybackControls'

export function FavoriteButton() {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { tracks, addTrack, removeTrack } = useFavorites()
  const isSaved = !!currentTrack && tracks.some((t) => t.uri === currentTrack.uri)
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleHeart = useCallback(() => {
    if (!currentTrack) return
    if (isSaved) {
      if (removeTrack(currentTrack.uri)) toast(t('favorites.removedFromList'), 'info')
      else toast(t('favorites.saveFailed'), 'error')
    } else if (addTrack(currentTrack)) {
      toast(t('favorites.addedToList'), 'success')
    } else {
      toast(t('favorites.saveFailed'), 'error')
    }
  }, [currentTrack, isSaved, addTrack, removeTrack, toast, t])

  if (!currentTrack) return null

  return (
    <div className="relative group shrink-0">
      <button
        onClick={handleHeart}
        aria-label={isSaved ? t('favorites.removeFromList') : t('favorites.addToList')}
        className={cn(
          'tap-target p-1.5 rounded-lg transition-all',
          isSaved ? 'text-primary scale-110' : 'text-black/60 hover:text-primary'
        )}
      >
        <Heart size={16} className={isSaved ? 'fill-current' : ''} />
      </button>
      <ControlTip label={isSaved ? t('favorites.removeFromList') : t('favorites.addToList')} />
    </div>
  )
}
