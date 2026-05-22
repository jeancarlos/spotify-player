import { z } from 'zod'

export const FavoriteTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  artist: z.string().min(1, 'Artista é obrigatório'),
  album: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string().datetime(),
})

export type FavoriteTrack = z.infer<typeof FavoriteTrackSchema>

export const FavoriteTrackFormSchema = FavoriteTrackSchema.omit({ id: true, createdAt: true })
export type FavoriteTrackForm = z.infer<typeof FavoriteTrackFormSchema>
