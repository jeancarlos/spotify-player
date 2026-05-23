import type { AudioFeatures } from '@/types/spotify'

type NumericAudioFeatureKey =
  | 'danceability' | 'energy' | 'valence' | 'acousticness'
  | 'speechiness' | 'instrumentalness' | 'liveness' | 'loudness' | 'tempo'

export function averageAudioFeatures(features: AudioFeatures[]): AudioFeatures | null {
  if (features.length === 0) return null
  const n = features.length
  const avg = (key: NumericAudioFeatureKey): number =>
    features.reduce((sum, f) => sum + (f[key] as number), 0) / n
  return {
    ...features[0],
    danceability:     avg('danceability'),
    energy:           avg('energy'),
    valence:          avg('valence'),
    acousticness:     avg('acousticness'),
    speechiness:      avg('speechiness'),
    instrumentalness: avg('instrumentalness'),
    liveness:         avg('liveness'),
    loudness:         avg('loudness'),
    tempo:            avg('tempo'),
  }
}
