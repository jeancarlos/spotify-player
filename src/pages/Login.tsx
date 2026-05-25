import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export function Login() {
  const { t } = useTranslation()
  const { login, state } = useAuth()
  const navigate = useNavigate()
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    if (state.isAuthenticated) navigate('/')
  }, [state.isAuthenticated, navigate])

  const handleLogin = async () => {
    setLoggingIn(true)
    await login()
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 overflow-hidden relative pb-[255px]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-5 right-5"
      >
        <LanguageSwitcher />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="relative z-10 text-6xl font-black tracking-tighter text-black font-sans"
      >
        Spoter
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="relative z-10 text-sm text-black/50 text-center max-w-xs leading-relaxed font-mono"
      >
        {t('login.hint')}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        onClick={handleLogin}
        disabled={loggingIn}
        className="relative z-10 px-10 py-3.5 bg-[#1DB954] border border-[#1DB954] text-white font-mono text-sm rounded-full hover:bg-black hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('login.button')}
      </motion.button>

      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        href="https://github.com/jeancarlos/spotify-player"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 translate-y-[-14px] text-black no-underline hover:underline"
        style={{ fontSize: '11px' }}
      >
        Ver no Github
      </motion.a>
    </div>
  )
}
