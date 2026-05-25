import React, { createContext, useReducer, useEffect, useCallback, useState, useRef } from 'react'
import type { SpotifyUser } from '@/types/spotify'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce'
import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import { STORAGE_KEYS } from '@/lib/storageKeys'
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

    const handler = (
      ev: MessageEvent<{ type?: string; nonce?: string | null; verifier?: string | null }>
    ) => {
      if (!ALLOWED_OPENER_ORIGINS.has(ev.origin)) return
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
    const accessToken = sessionStorage.getItem(STORAGE_KEYS.accessToken)
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
    const cachedProfile = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.userProfile)
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
  const activeLoginCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      activeLoginCleanupRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (!state.isAuthenticated || state.profile) return
    api
      .get<SpotifyUser>('/me')
      .then((res) => {
        try {
          localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(res.data))
        } catch {
          /* quota */
        }
        dispatch({ type: 'SET_PROFILE', payload: res.data })
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { status?: number } }
        if (axiosErr.response?.status === 429) {
          setTimeout(() => {
            setProfileRetry((prevCount) => prevCount + 1)
          }, 15_000)
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.accessToken)
          localStorage.removeItem(STORAGE_KEYS.refreshToken)
          dispatch({ type: 'LOGOUT' })
        }
      })
  }, [state.isAuthenticated, state.profile, profileRetry])

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const nonce = generateState()

    localStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier)
    localStorage.setItem(STORAGE_KEYS.pkceState, nonce)

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
    const POPUP_WIDTH = 500
    const POPUP_HEIGHT = 700
    const left = Math.round(screen.width / 2 - POPUP_WIDTH / 2)
    const top = Math.round(screen.height / 2 - POPUP_HEIGHT / 2)
    const popup = window.open(
      authUrl,
      'spotify_login',
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
    )

    if (!popup) {
      window.location.href = authUrl
      return
    }

    const onMessage = (
      event: MessageEvent<{ type?: string; accessToken?: string; refreshToken?: string }>
    ) => {
      if (event.source !== popup) return
      if (typeof event.data !== 'object') return

      if (event.data.type === 'REQUEST_PKCE_DATA') {
        const pkceVerifier = localStorage.getItem(STORAGE_KEYS.pkceVerifier)
        const pkceNonce = localStorage.getItem(STORAGE_KEYS.pkceState)
        popup.postMessage({ type: 'PKCE_DATA', verifier: pkceVerifier, nonce: pkceNonce }, REDIRECT_ORIGIN)
        return
      }

      if (event.data.type !== 'SPOTIFY_AUTH_TOKENS') return
      const { accessToken, refreshToken } = event.data
      if (!accessToken || !refreshToken) return

      cleanup()
      sessionStorage.setItem(STORAGE_KEYS.accessToken, accessToken)
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken)
      localStorage.removeItem(STORAGE_KEYS.pkceVerifier)
      localStorage.removeItem(STORAGE_KEYS.pkceState)
      dispatch({ type: 'SET_TOKENS', payload: { accessToken, refreshToken } })
    }

    const handles: {
      pollId: ReturnType<typeof setInterval> | undefined
      authTimeout: ReturnType<typeof setTimeout> | undefined
    } = { pollId: undefined, authTimeout: undefined }

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearInterval(handles.pollId)
      clearTimeout(handles.authTimeout)
      activeLoginCleanupRef.current = null
    }

    handles.pollId = setInterval(() => {
      if (popup.closed) cleanup()
    }, 1000)

    handles.authTimeout = setTimeout(cleanup, 5 * 60 * 1000)
    activeLoginCleanupRef.current = cleanup
    window.addEventListener('message', onMessage)
  }, [])

  const handleCallback = useCallback(async (code: string, receivedState: string) => {
    const { nonce, openerOrigin } = parseReceivedState(receivedState)

    let savedNonce = localStorage.getItem(STORAGE_KEYS.pkceState)
    let verifier = localStorage.getItem(STORAGE_KEYS.pkceVerifier)

    if (window.opener && (!savedNonce || !verifier)) {
      const pkce = await requestPkceFromOpener(window.opener as Window, openerOrigin)
      savedNonce = pkce.nonce
      verifier = pkce.verifier
    }

    if (nonce !== savedNonce || !verifier) {
      throw Object.assign(new Error(i18n.t('auth.invalidState')), { code: 'state_mismatch' })
    }

    const data = await exchangeCodeForTokens(code, verifier)

    localStorage.removeItem(STORAGE_KEYS.pkceVerifier)
    localStorage.removeItem(STORAGE_KEYS.pkceState)

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

    sessionStorage.setItem(STORAGE_KEYS.accessToken, data.access_token)
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token)
    dispatch({
      type: 'SET_TOKENS',
      payload: { accessToken: data.access_token, refreshToken: data.refresh_token },
    })
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    localStorage.removeItem(STORAGE_KEYS.userProfile)
    dispatch({ type: 'LOGOUT' })
  }, [])

  return (
    <AuthContext.Provider value={{ state, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}
