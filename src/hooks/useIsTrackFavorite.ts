import { useState, useEffect } from 'react'
import { readLocalTracks } from '@/utils/favStorage'

export function useIsTrackFavorite(uri: string | null | undefined, userId: string): boolean {
  const [isFav, setIsFav] = useState(() =>
    !!uri && !!userId && readLocalTracks(userId).some((t) => t.uri === uri)
  )

  useEffect(() => {
    if (!uri || !userId) {
      setIsFav(false)
      return
    }

    setIsFav(readLocalTracks(userId).some((t) => t.uri === uri))

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ userId: string }>).detail
      if (detail.userId === userId) {
        setIsFav(readLocalTracks(userId).some((t) => t.uri === uri))
      }
    }

    window.addEventListener('spoter:favorites-changed', handler)
    return () => window.removeEventListener('spoter:favorites-changed', handler)
  }, [uri, userId])

  return isFav
}
