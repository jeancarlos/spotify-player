import { describe, it, expect } from 'vitest'
import { playerReducer, initialPlayerState } from '../playerReducer'
import type { Track } from '@/types/music'

const mockTrack: Track = {
  id: 't1',
  name: 'Track 1',
  duration_ms: 210000,
  explicit: false,
  rank: 80,
  preview_url: null,
  uri: 'deezer:track:t1',
  type: 'track',
  artists: [{ id: 'a1', name: 'Artist 1', uri: 'deezer:artist:a1', type: 'artist' }],
  album: {
    id: 'al1',
    name: 'Album 1',
    images: [{ url: 'http://img.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [{ id: 'a1', name: 'Artist 1', uri: 'deezer:artist:a1', type: 'artist' }],
    uri: 'deezer:album:al1',
    type: 'album',
  },
}

describe('playerReducer', () => {
  it('SET_TRACK stores currentTrack', () => {
    const state = playerReducer(initialPlayerState, { type: 'SET_TRACK', payload: mockTrack })
    expect(state.currentTrack?.id).toBe('t1')
  })

  it('SET_PLAYING sets isPlaying directly', () => {
    const s1 = playerReducer(initialPlayerState, { type: 'SET_PLAYING', payload: true })
    expect(s1.isPlaying).toBe(true)
    expect(playerReducer(s1, { type: 'SET_PLAYING', payload: false }).isPlaying).toBe(false)
  })

  it('SET_LOADING sets isLoading', () => {
    expect(playerReducer(initialPlayerState, { type: 'SET_LOADING', payload: true }).isLoading).toBe(true)
  })

  it('SET_SHUFFLE sets shuffle directly', () => {
    const s1 = playerReducer(initialPlayerState, { type: 'SET_SHUFFLE', payload: true })
    expect(s1.shuffle).toBe(true)
    expect(playerReducer(s1, { type: 'SET_SHUFFLE', payload: true }).shuffle).toBe(true)
    expect(playerReducer(s1, { type: 'SET_SHUFFLE', payload: false }).shuffle).toBe(false)
  })

  it('SET_REPEAT sets repeat', () => {
    expect(playerReducer(initialPlayerState, { type: 'SET_REPEAT', payload: 'track' }).repeat).toBe('track')
  })

  it('SET_QUEUE stores the queue', () => {
    expect(playerReducer(initialPlayerState, { type: 'SET_QUEUE', payload: [mockTrack] }).queue).toHaveLength(1)
  })

  it('SET_QUEUE_INDEX stores the index of the playing track', () => {
    const next = playerReducer(initialPlayerState, { type: 'SET_QUEUE_INDEX', payload: 3 })
    expect(next.queueIndex).toBe(3)
    expect(initialPlayerState.queueIndex).toBe(0)
  })

  it('ignores unknown actions', () => {
    expect(playerReducer(initialPlayerState, { type: 'NOPE' } as never)).toBe(initialPlayerState)
  })
})
