import { z } from 'zod'
import i18n from '@/lib/i18n'

export const FavoriteTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, i18n.t('favorites.titleRequired')),
  artist: z.string().min(1, i18n.t('favorites.artistRequired')),
  album: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string().datetime(),
})

export type FavoriteTrack = z.infer<typeof FavoriteTrackSchema>

export const FavoriteTrackFormSchema = FavoriteTrackSchema.omit({ id: true, createdAt: true })
export type FavoriteTrackForm = z.infer<typeof FavoriteTrackFormSchema>
