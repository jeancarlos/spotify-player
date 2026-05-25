import i18n from '@/lib/i18n'

export interface SpotifyAuthConfig {
  clientId: string
  redirectUri: string
  redirectOrigin: string
}

export interface SpotifyTokenResponse {
  access_token: string
  refresh_token: string
}

export const SPOTIFY_SCOPES = [
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

export function getSpotifyAuthConfig(): SpotifyAuthConfig {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined

  if (!clientId || !redirectUri) {
    throw new Error('Spotify auth environment variables are missing')
  }

  return {
    clientId,
    redirectUri,
    redirectOrigin: new URL(redirectUri).origin,
  }
}

export function getAllowedAuthOrigins(redirectOrigin: string): Set<string> {
  return new Set([window.location.origin, redirectOrigin])
}

export function parseReceivedState(
  receivedState: string,
  allowedOrigins: Set<string>
): { nonce: string; openerOrigin: string } {
  let nonce = receivedState
  let openerOrigin = window.location.origin

  try {
    const decoded = JSON.parse(atob(receivedState)) as { n?: string; o?: string }
    if (decoded.n && decoded.o) {
      nonce = decoded.n
      openerOrigin = allowedOrigins.has(decoded.o) ? decoded.o : window.location.origin
    }
  } catch {
    /* plain state */
  }

  return { nonce, openerOrigin }
}

export async function requestPkceFromOpener(
  opener: Window,
  openerOrigin: string,
  allowedOrigins: Set<string>
): Promise<{ nonce: string | null; verifier: string | null }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      resolve({ nonce: null, verifier: null })
    }, 3000)

    const handleMessage = (
      event: MessageEvent<{ type?: string; nonce?: string | null; verifier?: string | null }>
    ) => {
      if (!allowedOrigins.has(event.origin)) return
      if (event.data.type !== 'PKCE_DATA') return

      clearTimeout(timer)
      window.removeEventListener('message', handleMessage)
      resolve({ nonce: event.data.nonce ?? null, verifier: event.data.verifier ?? null })
    }

    window.addEventListener('message', handleMessage)
    opener.postMessage({ type: 'REQUEST_PKCE_DATA' }, openerOrigin)
  })
}

export function buildSpotifyAuthorizeUrl({
  challenge,
  nonce,
  config,
}: {
  challenge: string
  nonce: string
  config: SpotifyAuthConfig
}): string {
  const statePayload = btoa(JSON.stringify({ n: nonce, o: window.location.origin }))
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: statePayload,
  })

  return `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCodeForTokens(
  code: string,
  verifier: string,
  config: SpotifyAuthConfig
): Promise<SpotifyTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: verifier,
  })

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!response.ok) {
    throw Object.assign(new Error(i18n.t('auth.tokenExchangeFailed')), { code: 'token_error' })
  }

  return response.json() as Promise<SpotifyTokenResponse>
}
