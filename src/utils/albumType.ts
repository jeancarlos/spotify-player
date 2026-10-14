import type { TFunction } from 'i18next'
import type { AlbumSimple } from '@/types/music'

export const albumTypeLabel = (t: TFunction, type: AlbumSimple['album_type']): string =>
  t(`albumType.${type}`)
