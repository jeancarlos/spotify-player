import type { SpotifyTrack } from '@/types/spotify'

export interface PlayerState {
  currentTrack: SpotifyTrack | null
  queue: SpotifyTrack[]
  isPlaying: boolean
  isLoading: boolean
  progress: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: 'off' | 'track' | 'context'
  isFullscreen: boolean
  palette: [string, string] | null
}

export type PlayerAction =
  | { type: 'SET_TRACK'; payload: SpotifyTrack }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_SHUFFLE'; payload: boolean }
  | { type: 'SET_REPEAT'; payload: 'off' | 'track' | 'context' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_PALETTE'; payload: [string, string] }
  | { type: 'SET_QUEUE'; payload: SpotifyTrack[] }
  | { type: 'TICK_PROGRESS' }

export const initialPlayerState: PlayerState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  isLoading: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  shuffle: false,
  repeat: 'off',
  isFullscreen: false,
  palette: null,
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        duration: action.payload.duration_ms,
        progress: 0,
      }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }
    case 'SET_VOLUME':
      return { ...state, volume: Math.min(1, Math.max(0, action.payload)) }
    case 'TOGGLE_SHUFFLE':
      return { ...state, shuffle: !state.shuffle }
    case 'SET_SHUFFLE':
      return { ...state, shuffle: action.payload }
    case 'SET_REPEAT':
      return { ...state, repeat: action.payload }
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen }
    case 'SET_PALETTE':
      return { ...state, palette: action.payload }
    case 'SET_QUEUE':
      return { ...state, queue: action.payload }
    case 'TICK_PROGRESS':
      if (state.duration === 0) return state
      return { ...state, progress: Math.min(state.progress + 1000, state.duration) }
    default:
      return state
  }
}
