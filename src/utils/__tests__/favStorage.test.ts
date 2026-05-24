import { describe, it, expect, beforeEach } from 'vitest'
import {
  readLocalTracks,
  writeLocalTracks,
  readLocalNotes,
  writeLocalNotes,
} from '@/utils/favStorage'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack = (id: string): SpotifyTrack =>
  ({
    id,
    uri: `spotify:track:${id}`,
    name: `Track ${id}`,
    duration_ms: 180000,
    explicit: false,
    popularity: 50,
    preview_url: null,
    type: 'track',
    artists: [{ id: 'a1', name: 'Artista', uri: 'spotify:artist:a1', type: 'artist' }],
    album: {
      id: 'alb1',
      name: 'Álbum',
      images: [{ url: 'https://img.example.com/1.jpg', width: 300, height: 300 }],
      release_date: '2024-01-01',
      album_type: 'album',
      artists: [],
      uri: 'spotify:album:alb1',
      type: 'album',
    },
  })

beforeEach(() => { localStorage.clear(); })

describe('readLocalTracks', () => {
  it('retorna [] quando não há dados', () => {
    expect(readLocalTracks('u1')).toEqual([])
  })

  it('retorna [] quando o JSON está corrompido', () => {
    localStorage.setItem('spoter_favorites_u1', '{broken}')
    expect(readLocalTracks('u1')).toEqual([])
  })

  it('retorna as tracks salvas', () => {
    writeLocalTracks('u1', [mockTrack('t1'), mockTrack('t2')])
    const result = readLocalTracks('u1')
    expect(result).toHaveLength(2)
    expect(result[0].uri).toBe('spotify:track:t1')
  })

  it('isola por userId', () => {
    writeLocalTracks('u1', [mockTrack('t1')])
    expect(readLocalTracks('u2')).toHaveLength(0)
  })
})

describe('writeLocalTracks', () => {
  it('sobrescreve tracks anteriores', () => {
    writeLocalTracks('u1', [mockTrack('t1')])
    writeLocalTracks('u1', [mockTrack('t2'), mockTrack('t3')])
    expect(readLocalTracks('u1')).toHaveLength(2)
  })
})

describe('readLocalNotes', () => {
  it('retorna {} quando não há dados', () => {
    expect(readLocalNotes('u1')).toEqual({})
  })

  it('retorna notas salvas', () => {
    writeLocalNotes('u1', { 'spotify:track:t1': 'ouço no treino' })
    expect(readLocalNotes('u1')['spotify:track:t1']).toBe('ouço no treino')
  })
})

describe('writeLocalNotes', () => {
  it('persiste e recupera corretamente', () => {
    const notes = { 'spotify:track:x': 'nota x', 'spotify:track:y': 'nota y' }
    writeLocalNotes('u1', notes)
    expect(readLocalNotes('u1')).toEqual(notes)
  })
})
