import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { VinylDisk } from '@/components/vinyl/VinylDisk'

export function Login() {
  const { t } = useTranslation()
  const { login, state } = useAuth()
  const navigate = useNavigate()
  const controls = useAnimationControls()

  useEffect(() => {
    if (state.isAuthenticated) navigate('/')
  }, [state.isAuthenticated, navigate])

  const handleLogin = async () => {
    await controls.start({
      y: '-110vh',
      transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
    })
    await login()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-6xl font-black tracking-tighter text-black"
      >
        Spoter
      </motion.h1>

      <motion.div
        animate={controls}
        initial={{ y: 80, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <VinylDisk size="lg" isPlaying={false} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onClick={handleLogin}
        className="px-10 py-3.5 bg-[#1DB954] text-black font-bold text-sm rounded-full hover:bg-[#1ed760] transition-colors shadow-lg shadow-[#1DB954]/20"
      >
        {t('login.button')}
      </motion.button>
    </div>
  )
}
