import { useReducer, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import type { FavoriteTrack, FavoriteTrackForm } from '@/types/favorites'

const STORAGE_KEY = 'spoter_favorites'

type Action =
  | { type: 'ADD'; payload: FavoriteTrack }
  | { type: 'REMOVE'; id: string }

function reducer(state: FavoriteTrack[], action: Action): FavoriteTrack[] {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state]
    case 'REMOVE':
      return state.filter(f => f.id !== action.id)
    default:
      return state
  }
}

function loadFromStorage(): FavoriteTrack[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoriteTrack[]
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, dispatch] = useReducer(reducer, undefined, loadFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  function add(form: FavoriteTrackForm) {
    dispatch({
      type: 'ADD',
      payload: { id: uuid(), ...form, createdAt: new Date().toISOString() },
    })
  }

  function remove(id: string) {
    dispatch({ type: 'REMOVE', id })
  }

  function search(query: string): FavoriteTrack[] {
    const q = query.toLowerCase()
    return favorites.filter(
      f =>
        f.title.toLowerCase().includes(q) ||
        f.artist.toLowerCase().includes(q) ||
        f.album?.toLowerCase().includes(q)
    )
  }

  return { favorites, add, remove, search }
}
