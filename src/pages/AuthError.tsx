import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ShieldX } from 'lucide-react'

function getDescription(t: (key: string) => string, reason: string): string {
  if (reason === 'state_mismatch') return t('authError.stateMismatch')
  if (reason === 'token_error') return t('authError.tokenError')
  return t('authError.unknown')
}

export function AuthError() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reason = searchParams.get('reason') ?? 'unknown'
  const isPopup = !!window.opener

  const handleAction = () => {
    if (isPopup) {
      window.close()
    } else {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-5 overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-5 max-w-sm px-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-black/6 flex items-center justify-center">
          <ShieldX size={28} className="text-black/40" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight text-black font-sans">
            {t('authError.title')}
          </h1>
          <p className="text-sm text-black/50 font-mono leading-relaxed">
            {getDescription(t, reason)}
          </p>
          <p className="text-xs text-black/30 font-mono leading-relaxed mt-1">
            {t('authError.hint')}
          </p>
        </div>

        <button
          onClick={handleAction}
          className="px-8 py-3 bg-black text-white font-mono text-sm rounded-full hover:bg-black/80 transition-colors"
        >
          {isPopup ? t('authError.close') : t('authError.retry')}
        </button>
      </motion.div>
    </div>
  )
}
