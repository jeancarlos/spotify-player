import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import i18n from '@/lib/i18n'

const api = axios.create({
  baseURL: 'https://api.spotify.com/v1',
})

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let backoffUntil = 0

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

api.interceptors.request.use(async (config) => {
  const wait = backoffUntil - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))

  const token = sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined
    if (error.response?.status === 429 && originalRequest) {
      const retryAfter = Number(error.response.headers['retry-after'] ?? 10)
      backoffUntil = Date.now() + retryAfter * 1000
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
      return api(originalRequest)
    }

    if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshToken().finally(() => {
            isRefreshing = false
            refreshPromise = null
          })
        }

        const newToken = await refreshPromise
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return await api(originalRequest)
        }
      } catch (refreshError) {
        sessionStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(
          refreshError instanceof Error ? refreshError : new Error('Refresh failed')
        )
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error('Request failed'))
  }
)

async function refreshToken(): Promise<string> {
  const refresh_token = localStorage.getItem('refresh_token')
  if (!refresh_token) {
    throw new Error('No refresh token available')
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!res.ok) throw new Error(i18n.t('auth.tokenExchangeFailed'))

  const data = (await res.json()) as { access_token: string; refresh_token: string }

  sessionStorage.setItem('access_token', data.access_token)
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token)
  }

  return data.access_token
}

export default api
