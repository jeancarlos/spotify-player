import { useCallback } from 'react'
import { Heart } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ControlTip } from './PlaybackControls'
import type { SpotifyTrack } from '@/types/spotify'

interface FavoriteButtonProps {
  isSaved: boolean
  addTrack: (track: SpotifyTrack) => void
  removeTrack: (uri: string) => void
}

export function FavoriteButton({ isSaved, addTrack, removeTrack }: FavoriteButtonProps) {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleHeart = useCallback(() => {
    if (!currentTrack) return
    if (isSaved) {
      removeTrack(currentTrack.uri)
      toast(t('favorites.removedFromList'), 'info')
    } else {
      addTrack(currentTrack)
      toast(t('favorites.addedToList'), 'success')
    }
  }, [currentTrack, isSaved, addTrack, removeTrack, toast, t])

  if (!currentTrack) return null

  return (
    <div className="relative group shrink-0">
      <button
        onClick={handleHeart}
        aria-label={isSaved ? t('favorites.removeFromList') : t('favorites.addToList')}
        className={cn(
          'p-1.5 rounded-lg transition-all',
          isSaved ? 'text-red-500 scale-110' : 'text-black/30 hover:text-red-400'
        )}
      >
        <Heart size={16} className={isSaved ? 'fill-current' : ''} />
      </button>
      <ControlTip label={isSaved ? t('favorites.removeFromList') : t('favorites.addToList')} />
    </div>
  )
}
