import type { Track } from '@/types/music'

export interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  shuffle: boolean
  repeat: 'off' | 'track' | 'context'
}

export type PlayerAction =
  | { type: 'SET_TRACK'; payload: Track }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHUFFLE'; payload: boolean }
  | { type: 'SET_REPEAT'; payload: 'off' | 'track' | 'context' }
  | { type: 'SET_QUEUE'; payload: Track[] }
  | { type: 'SET_QUEUE_INDEX'; payload: number }

export const initialPlayerState: PlayerState = {
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isLoading: false,
  shuffle: false,
  repeat: 'off',
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_TRACK':
      return { ...state, currentTrack: action.payload }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_SHUFFLE':
      return { ...state, shuffle: action.payload }
    case 'SET_REPEAT':
      return { ...state, repeat: action.payload }
    case 'SET_QUEUE':
      return { ...state, queue: action.payload }
    case 'SET_QUEUE_INDEX':
      return { ...state, queueIndex: action.payload }
    default:
      return state
  }
}
