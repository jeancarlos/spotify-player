import type { SpotifyUser } from '@/types/spotify'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  profile: SpotifyUser | null
  isAuthenticated: boolean
}

export type AuthAction =
  | { type: 'SET_TOKENS'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'SET_PROFILE'; payload: SpotifyUser }
  | { type: 'LOGOUT' }

export const initialAuthState: AuthState = {
  accessToken: null,
  refreshToken: null,
  profile: null,
  isAuthenticated: false,
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_TOKENS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
      }
    case 'SET_PROFILE':
      return { ...state, profile: action.payload }
    case 'LOGOUT':
      return initialAuthState
    default:
      return state
  }
}
