import { AnimatePresence, motion } from 'framer-motion'
import { X, Heart, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUI } from '@/hooks/useUI'
import i18n from '@/lib/i18n'

export function HamburgerMenu() {
  const { state: uiState, dispatch: uiDispatch } = useUI()
  const { state: authState, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const isOpen = uiState.sidebarOpen
  const open = () => uiDispatch({ type: 'OPEN_SIDEBAR' })
  const close = () => uiDispatch({ type: 'CLOSE_SIDEBAR' })

  const handleNav = (path: string) => {
    close()
    navigate(path)
  }

  const handleLogout = () => {
    close()
    logout()
    navigate('/login')
  }

  const toggleLang = () => {
    const next = i18n.language.startsWith('pt') ? 'en-US' : 'pt-BR'
    i18n.changeLanguage(next)
  }

  const avatar = authState.profile?.images[0]?.url

  return (
    <>
      {/* Hamburger button — fixo top-left */}
      <button
        onClick={open}
        className="fixed top-4 left-4 z-40 p-2 glass rounded-xl hover:bg-black/5 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} className="text-black/70" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Drawer */}
            <motion.nav
              className="fixed top-0 left-0 bottom-0 z-50 w-72 glass flex flex-col py-8 px-6 gap-6"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-black/40 font-bold">
                      {authState.profile?.display_name?.[0] ?? '?'}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-black truncate max-w-[140px]">
                    {authState.profile?.display_name ?? ''}
                  </span>
                </div>
                <button onClick={close} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X size={18} className="text-black/50" />
                </button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <button
                  onClick={() => handleNav('/favorites')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-left"
                >
                  <Heart size={18} className="text-black/50" />
                  <span className="text-sm text-black/70">{t('nav.favorites')}</span>
                </button>

                <button
                  onClick={toggleLang}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-left"
                >
                  <span className="text-base">🌐</span>
                  <span className="text-sm text-black/70">
                    {i18n.language.startsWith('pt') ? 'PT → EN' : 'EN → PT'}
                  </span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={18} className="text-red-400" />
                <span className="text-sm text-red-400">{t('nav.logout')}</span>
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
