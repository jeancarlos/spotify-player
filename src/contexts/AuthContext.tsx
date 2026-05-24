import React, { createContext, useReducer, useEffect, useCallback, useState } from 'react'
import type { SpotifyUser } from '@/types/spotify'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce'
import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import { authReducer, initialAuthState, type AuthState } from './authReducer'

interface AuthContextValue {
  state: AuthState
  login: () => Promise<void>
  logout: () => void
  handleCallback: (code: string, state: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const REDIRECT_ORIGIN = new URL(import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string).origin
const ALLOWED_OPENER_ORIGINS = new Set([window.location.origin, REDIRECT_ORIGIN])

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'user-follow-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming',
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
  'ugc-image-upload',
].join(' ')

async function requestPkceFromOpener(
  opener: Window,
  openerOrigin: string
): Promise<{ nonce: string | null; verifier: string | null }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler)
      resolve({ nonce: null, verifier: null })
    }, 3000)

    const handler = (ev: MessageEvent<{ type?: string; nonce?: string | null; verifier?: string | null }>) => {
      if (ev.data.type !== 'PKCE_DATA') return
      clearTimeout(timer)
      window.removeEventListener('message', handler)
      resolve({ nonce: ev.data.nonce ?? null, verifier: ev.data.verifier ?? null })
    }

    window.addEventListener('message', handler)
    opener.postMessage({ type: 'REQUEST_PKCE_DATA' }, openerOrigin)
  })
}

function parseReceivedState(receivedState: string): { nonce: string; openerOrigin: string } {
  let nonce = receivedState
  let openerOrigin = window.location.origin
  try {
    const decoded = JSON.parse(atob(receivedState)) as { n?: string; o?: string }
    if (decoded.n && decoded.o) {
      nonce = decoded.n
      openerOrigin = ALLOWED_OPENER_ORIGINS.has(decoded.o) ? decoded.o : window.location.origin
    }
  } catch {
    /* plain state — same-tab flow */
  }
  return { nonce, openerOrigin }
}

async function exchangeCodeForTokens(
  code: string,
  verifier: string
): Promise<{ access_token: string; refresh_token: string }> {
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

  if (!res.ok) {
    throw Object.assign(new Error(i18n.t('auth.tokenExchangeFailed')), { code: 'token_error' })
  }

  return res.json() as Promise<{ access_token: string; refresh_token: string }>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState, () => {
    const accessToken = sessionStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const cachedProfile = (() => {
      try {
        const raw = localStorage.getItem('user_profile')
        return raw ? (JSON.parse(raw) as SpotifyUser) : null
      } catch {
        return null
      }
    })()
    return {
      accessToken,
      refreshToken,
      profile: cachedProfile,
      isAuthenticated: !!accessToken,
    }
  })

  const [profileRetry, setProfileRetry] = useState(0)

  useEffect(() => {
    if (!state.isAuthenticated || state.profile) return
    api
      .get<SpotifyUser>('/me')
      .then((res) => {
        try {
          localStorage.setItem('user_profile', JSON.stringify(res.data))
        } catch {
          /* quota */
        }
        dispatch({ type: 'SET_PROFILE', payload: res.data })
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { status?: number } }
        if (axiosErr.response?.status === 429) {
          setTimeout(() => { setProfileRetry((n) => n + 1); }, 15_000)
        } else {
          sessionStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          dispatch({ type: 'LOGOUT' })
        }
      })
  }, [state.isAuthenticated, state.profile, profileRetry])

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const nonce = generateState()

    localStorage.setItem('pkce_verifier', verifier)
    localStorage.setItem('pkce_state', nonce)

    const statePayload = btoa(JSON.stringify({ n: nonce, o: window.location.origin }))

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state: statePayload,
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params}`
    const w = 500,
      h = 700
    const left = Math.round(screen.width / 2 - w / 2)
    const top = Math.round(screen.height / 2 - h / 2)
    const popup = window.open(
      authUrl,
      'spotify_login',
      `width=${w},height=${h},left=${left},top=${top}`
    )

    if (!popup) {
      window.location.href = authUrl
      return
    }

    const onMessage = (event: MessageEvent<{ type?: string; accessToken?: string; refreshToken?: string }>) => {
      if (event.source !== popup) return
      if (typeof event.data !== 'object') return

      if (event.data.type === 'REQUEST_PKCE_DATA') {
        const v = localStorage.getItem('pkce_verifier')
        const n = localStorage.getItem('pkce_state')
        popup.postMessage({ type: 'PKCE_DATA', verifier: v, nonce: n }, REDIRECT_ORIGIN)
        return
      }

      if (event.data.type !== 'SPOTIFY_AUTH_TOKENS') return
      const { accessToken, refreshToken } = event.data
      if (!accessToken || !refreshToken) return

      cleanup()
      sessionStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.removeItem('pkce_verifier')
      localStorage.removeItem('pkce_state')
      dispatch({ type: 'SET_TOKENS', payload: { accessToken, refreshToken } })
    }

    const pollId = setInterval(() => {
      if (popup.closed) cleanup()
    }, 1000)

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearInterval(pollId)
    }

    window.addEventListener('message', onMessage)
  }, [])

  const handleCallback = useCallback(async (code: string, receivedState: string) => {
    const { nonce, openerOrigin } = parseReceivedState(receivedState)

    let savedNonce = localStorage.getItem('pkce_state')
    let verifier = localStorage.getItem('pkce_verifier')

    if (window.opener && (!savedNonce || !verifier)) {
      const pkce = await requestPkceFromOpener(window.opener as Window, openerOrigin)
      savedNonce = pkce.nonce
      verifier = pkce.verifier
    }

    if (nonce !== savedNonce || !verifier) {
      throw Object.assign(new Error(i18n.t('auth.invalidState')), { code: 'state_mismatch' })
    }

    const data = await exchangeCodeForTokens(code, verifier)

    localStorage.removeItem('pkce_verifier')
    localStorage.removeItem('pkce_state')

    if (window.opener) {
      const opener = window.opener as Window
      opener.postMessage(
        {
          type: 'SPOTIFY_AUTH_TOKENS',
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
        openerOrigin
      )
      window.close()
      return
    }

    sessionStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    dispatch({
      type: 'SET_TOKENS',
      payload: { accessToken: data.access_token, refreshToken: data.refresh_token },
    })
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_profile')
    dispatch({ type: 'LOGOUT' })
  }, [])

  return (
    <AuthContext.Provider value={{ state, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}
