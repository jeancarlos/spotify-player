import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../useFavorites'

beforeEach(() => {
  localStorage.clear()
})

describe('useFavorites', () => {
  it('starts with empty list', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toHaveLength(0)
  })

  it('adds a favorite and persists to localStorage', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Track 1', artist: 'Artist 1', album: 'Album 1', note: '' })
    })
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].title).toBe('Track 1')
    const stored = JSON.parse(localStorage.getItem('spoter_favorites') ?? '[]') as unknown[]
    expect(stored).toHaveLength(1)
  })

  it('removes a favorite by id', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Track 1', artist: 'Artist 1' })
    })
    const id = result.current.favorites[0].id
    act(() => {
      result.current.remove(id)
    })
    expect(result.current.favorites).toHaveLength(0)
  })

  it('searches favorites by title', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Bohemian Rhapsody', artist: 'Queen' })
      result.current.add({ title: 'Stairway to Heaven', artist: 'Led Zeppelin' })
    })
    expect(result.current.search('Bohemian')).toHaveLength(1)
    expect(result.current.search('Bohemian')[0].title).toBe('Bohemian Rhapsody')
  })

  it('search is case-insensitive and matches artist too', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Comfortably Numb', artist: 'Pink Floyd' })
    })
    expect(result.current.search('pink floyd')).toHaveLength(1)
  })

  it('rehydrates from localStorage on mount', () => {
    const stored = [
      { id: 'abc-123', title: 'Stored Track', artist: 'Stored Artist', createdAt: new Date().toISOString() },
    ]
    localStorage.setItem('spoter_favorites', JSON.stringify(stored))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites[0].title).toBe('Stored Track')
  })
})
