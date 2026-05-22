import { describe, it, expect } from 'vitest'
import { playerReducer, initialPlayerState } from '../playerReducer'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack: SpotifyTrack = {
  id: 't1',
  name: 'Track 1',
  duration_ms: 210000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  uri: 'spotify:track:t1',
  type: 'track',
  artists: [{ id: 'a1', name: 'Artist 1', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'al1',
    name: 'Album 1',
    images: [{ url: 'http://img.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [{ id: 'a1', name: 'Artist 1', uri: 'spotify:artist:a1', type: 'artist' }],
    uri: 'spotify:album:al1',
    type: 'album',
  },
}

describe('playerReducer', () => {
  it('SET_TRACK atualiza currentTrack e reseta progress', () => {
    const state = playerReducer(initialPlayerState, { type: 'SET_TRACK', payload: mockTrack })
    expect(state.currentTrack?.id).toBe('t1')
    expect(state.progress).toBe(0)
    expect(state.duration).toBe(210000)
  })

  it('TOGGLE_PLAY inverte isPlaying', () => {
    const s1 = playerReducer(initialPlayerState, { type: 'TOGGLE_PLAY' })
    expect(s1.isPlaying).toBe(true)
    const s2 = playerReducer(s1, { type: 'TOGGLE_PLAY' })
    expect(s2.isPlaying).toBe(false)
  })

  it('SET_VOLUME limita entre 0 e 1', () => {
    const s1 = playerReducer(initialPlayerState, { type: 'SET_VOLUME', payload: 1.5 })
    expect(s1.volume).toBe(1)
    const s2 = playerReducer(initialPlayerState, { type: 'SET_VOLUME', payload: -0.1 })
    expect(s2.volume).toBe(0)
  })

  it('SET_PALETTE atualiza a paleta', () => {
    const state = playerReducer(initialPlayerState, {
      type: 'SET_PALETTE',
      payload: ['100,50,200', '50,100,150'],
    })
    expect(state.palette).toEqual(['100,50,200', '50,100,150'])
  })

  it('TOGGLE_FULLSCREEN inverte isFullscreen', () => {
    const state = playerReducer(initialPlayerState, { type: 'TOGGLE_FULLSCREEN' })
    expect(state.isFullscreen).toBe(true)
  })

  it('SET_PLAYING define isPlaying diretamente', () => {
    const s1 = playerReducer(initialPlayerState, { type: 'SET_PLAYING', payload: true })
    expect(s1.isPlaying).toBe(true)
    const s2 = playerReducer(s1, { type: 'SET_PLAYING', payload: false })
    expect(s2.isPlaying).toBe(false)
  })

  it('SET_SHUFFLE define shuffle diretamente sem toggle', () => {
    const s1 = playerReducer(initialPlayerState, { type: 'SET_SHUFFLE', payload: true })
    expect(s1.shuffle).toBe(true)
    // idempotente — não togla se já está true
    const s2 = playerReducer(s1, { type: 'SET_SHUFFLE', payload: true })
    expect(s2.shuffle).toBe(true)
    const s3 = playerReducer(s2, { type: 'SET_SHUFFLE', payload: false })
    expect(s3.shuffle).toBe(false)
  })
})
