import { createContext, useContext, type ReactNode } from 'react'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import type { SpotifyTrack } from '@/types/spotify'

// Contrato público do contexto de favoritos
interface FavoritesContextValue {
  playlistId: string
  playlistName: string
  tracks: SpotifyTrack[]
  notes: Record<string, string>
  addTrack: (track: SpotifyTrack, note?: string) => void
  removeTrack: (uri: string) => void
  updateNote: (uri: string, note: string) => void
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

// Provider que instancia o hook uma única vez na árvore
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const value = useSpoterPlaylist()
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

// Hook de consumo — lança erro se usado fora do provider
export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider')
  return ctx
}
