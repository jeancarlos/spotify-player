import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { handleCallback } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error || !code || !state) {
      navigate('/login')
      return
    }

    handleCallback(code, state)
      .then(() => navigate('/'))
      .catch(() => navigate('/login'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-white/60 text-sm font-mono">{t('auth.authenticating')}</p>
    </div>
  )
}
