import React, { createContext, useReducer, useEffect, useCallback } from 'react'
import type { SpotifyUser } from '@/types/spotify'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce'
import api from '@/lib/axios'
import i18n from '@/lib/i18n'
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
  'playlist-modify-private', 'playlist-modify-public',
  'ugc-image-upload',
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
      api.get<SpotifyUser>('/me')
        .then(res => dispatch({ type: 'SET_PROFILE', payload: res.data }))
        .catch(() => dispatch({ type: 'LOGOUT' }))
    }
  }, [state.isAuthenticated, state.profile])

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const stateParam = generateState()

    // localStorage is shared with the popup window; sessionStorage is tab-isolated
    localStorage.setItem('pkce_verifier', verifier)
    localStorage.setItem('pkce_state', stateParam)

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state: stateParam,
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params}`
    const w = 500, h = 700
    const left = Math.round(screen.width / 2 - w / 2)
    const top = Math.round(screen.height / 2 - h / 2)
    const popup = window.open(authUrl, 'spotify_login', `width=${w},height=${h},left=${left},top=${top}`)

    if (!popup) {
      // Popup blocked — fallback to same-tab redirect
      window.location.href = authUrl
      return
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'SPOTIFY_AUTH_TOKENS') return
      window.removeEventListener('message', onMessage)
      const { accessToken, refreshToken } = event.data as { type: string; accessToken: string; refreshToken: string }
      sessionStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.removeItem('pkce_verifier')
      localStorage.removeItem('pkce_state')
      dispatch({ type: 'SET_TOKENS', payload: { accessToken, refreshToken } })
    }

    window.addEventListener('message', onMessage)
  }, [])

  const handleCallback = useCallback(async (code: string, receivedState: string) => {
    // PKCE stored in localStorage so popup window can access it
    const savedState = localStorage.getItem('pkce_state')
    const verifier = localStorage.getItem('pkce_verifier')

    if (receivedState !== savedState || !verifier) {
      throw new Error(i18n.t('auth.invalidState'))
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

    if (!res.ok) throw new Error(i18n.t('auth.tokenExchangeFailed'))

    const data = (await res.json()) as { access_token: string; refresh_token: string }

    localStorage.removeItem('pkce_verifier')
    localStorage.removeItem('pkce_state')

    if (window.opener) {
      // Popup mode: hand tokens to the main window and close
      window.opener.postMessage(
        { type: 'SPOTIFY_AUTH_TOKENS', accessToken: data.access_token, refreshToken: data.refresh_token },
        window.location.origin,
      )
      window.close()
      return
    }

    // Same-tab fallback
    sessionStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
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
