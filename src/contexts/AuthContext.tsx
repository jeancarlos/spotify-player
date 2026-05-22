import React, { createContext, useReducer, useEffect, useCallback } from 'react'
import type { SpotifyUser } from '@/types/spotify'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce'
import api from '@/lib/axios'
import { authReducer, initialAuthState } from './authReducer'
import type { AuthState } from './authReducer'

interface AuthContextValue {
  state: AuthState
  login: () => Promise<void>
  logout: () => void
  handleCallback: (code: string, state: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const SCOPES = [
  'user-read-private', 'user-read-email',
  'user-top-read', 'user-read-recently-played',
  'user-library-read', 'user-follow-read',
  'user-read-playback-state', 'user-modify-playback-state',
  'streaming', 'playlist-read-private',
].join(' ')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState, () => {
    const accessToken = sessionStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    return {
      accessToken,
      refreshToken,
      profile: null,
      isAuthenticated: !!accessToken,
    }
  })

  useEffect(() => {
    if (state.isAuthenticated && !state.profile) {
      api.get<SpotifyUser>('/me').then(res => {
        dispatch({ type: 'SET_PROFILE', payload: res.data })
      })
    }
  }, [state.isAuthenticated, state.profile])

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const stateParam = generateState()

    sessionStorage.setItem('pkce_verifier', verifier)
    sessionStorage.setItem('pkce_state', stateParam)

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state: stateParam,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params}`
  }, [])

  const handleCallback = useCallback(async (code: string, receivedState: string) => {
    const savedState = sessionStorage.getItem('pkce_state')
    const verifier = sessionStorage.getItem('pkce_verifier')

    if (receivedState !== savedState || !verifier) {
      throw new Error('Estado OAuth inválido ou verifier ausente')
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
      code_verifier: verifier,
    })

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    if (!res.ok) throw new Error('Troca de token falhou')

    const data = (await res.json()) as { access_token: string; refresh_token: string }

    sessionStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    sessionStorage.removeItem('pkce_verifier')
    sessionStorage.removeItem('pkce_state')

    dispatch({ type: 'SET_TOKENS', payload: { accessToken: data.access_token, refreshToken: data.refresh_token } })
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    dispatch({ type: 'LOGOUT' })
  }, [])

  return (
    <AuthContext.Provider value={{ state, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}
