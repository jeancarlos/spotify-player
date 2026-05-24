import { useSyncExternalStore } from 'react'
import { readLocalTracks } from '@/utils/favStorage'

function subscribe(callback: () => void) {
  window.addEventListener('spoter:favorites-changed', callback)
  return () => { window.removeEventListener('spoter:favorites-changed', callback); }
}

export function useIsTrackFavorite(uri: string | null | undefined, userId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !!uri && !!userId && readLocalTracks(userId).some((t) => t.uri === uri),
    () => false
  )
}
