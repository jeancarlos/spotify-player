import { describe, it, expect } from 'vitest'
import { averageAudioFeatures } from '../audioFeatures'
import type { AudioFeatures } from '@/types/spotify'

const makeFeature = (v: number): AudioFeatures => ({
  id: 'x',
  type: 'audio_features',
  uri: '',
  track_href: '',
  analysis_url: '',
  danceability: v,
  energy: v,
  valence: v,
  acousticness: v,
  speechiness: v,
  instrumentalness: v,
  liveness: v,
  loudness: v * -10,
  tempo: v * 100,
  duration_ms: 200000,
  key: 5,
  mode: 1,
  time_signature: 4,
})

describe('averageAudioFeatures', () => {
  it('retorna null para array vazio', () => {
    expect(averageAudioFeatures([])).toBeNull()
  })

  it('retorna o único item inalterado', () => {
    const f = makeFeature(0.6)
    const result = averageAudioFeatures([f])
    expect(result?.danceability).toBeCloseTo(0.6)
    expect(result?.energy).toBeCloseTo(0.6)
  })

  it('calcula média correta de múltiplos itens', () => {
    const result = averageAudioFeatures([makeFeature(0.2), makeFeature(0.8)])
    expect(result?.danceability).toBeCloseTo(0.5)
    expect(result?.energy).toBeCloseTo(0.5)
    expect(result?.tempo).toBeCloseTo(50)
  })
})
