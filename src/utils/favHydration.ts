import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'

// Limite da API Spotify: máximo 50 IDs por request
const SPOTIFY_BATCH_LIMIT = 50

export async function hydrateFromApi(uris: string[]): Promise<SpotifyTrack[]> {
  if (uris.length === 0) return []

  const ids = uris
    .map((uri) => uri.replace('spotify:track:', ''))
    .filter(Boolean)
    .slice(0, SPOTIFY_BATCH_LIMIT)

  try {
    const { data } = await api.get<{ tracks: (SpotifyTrack | null)[] }>('/tracks', {
      params: { ids: ids.join(',') },
    })
    return data.tracks.filter((t): t is SpotifyTrack => t !== null)
  } catch {
    return []
  }
}
