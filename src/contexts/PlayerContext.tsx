import React, { createContext, useReducer } from 'react'
import {
  playerReducer,
  initialPlayerState,
  type PlayerState,
  type PlayerAction,
} from './playerReducer'

interface PlayerContextValue {
  state: PlayerState
  dispatch: React.Dispatch<PlayerAction>
}

export const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState)
  return <PlayerContext.Provider value={{ state, dispatch }}>{children}</PlayerContext.Provider>
}
