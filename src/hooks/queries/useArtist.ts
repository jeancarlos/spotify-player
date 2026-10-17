import { useDeezerEntity } from './useDeezerEntity'
import { toArtist, type DzArtist } from '@/lib/deezerMappers'
import type { Artist } from '@/types/music'

export function useArtist(id: string | undefined) {
  return useDeezerEntity<DzArtist, Artist>('artist', id, toArtist)
}
