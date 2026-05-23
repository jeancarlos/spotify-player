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

  useEffect(() => {
    controls.start({ opacity: 1, transition: { delay: 0.3, duration: 0.6, ease: 'easeOut' } })
  }, [controls])

  const handleLogin = async () => {
    await controls.start({
      y: '-110vh',
      transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
    })
    await login()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-24 overflow-hidden relative">
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-6xl font-black tracking-tighter text-black mb-4"
      >
        Spoter
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-sm text-black/50 text-center max-w-xs leading-relaxed mb-8 font-mono"
      >
        {t('login.hint')}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        onClick={handleLogin}
        className="px-10 py-3.5 border border-black text-black font-mono text-sm rounded-full hover:bg-black hover:text-white transition-colors"
      >
        {t('login.button')}
      </motion.button>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <motion.div animate={controls} initial={{ opacity: 0 }}>
          <VinylDisk size="lg" isPlaying={false} />
        </motion.div>
      </div>
    </div>
  )
}
