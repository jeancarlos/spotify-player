import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="glass-card p-10 flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t('login.title')}</h1>
          <p className="text-white/60 mt-2 text-sm">{t('login.subtitle')}</p>
        </div>
        <Button
          id="login-button"
          onClick={login}
          className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-12 rounded-full"
        >
          {t('login.button')}
        </Button>
      </div>
    </div>
  )
}
