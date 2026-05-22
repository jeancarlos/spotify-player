import { useContext } from 'react'
import { PlayerContext } from '@/contexts/PlayerContext'

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer deve ser usado dentro do PlayerProvider')
  return ctx
}
