import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Heart, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUI } from '@/hooks/useUI'

export function HamburgerMenu() {
  const { state: uiState, dispatch: uiDispatch } = useUI()
  const { state: authState, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isOpen = uiState.sidebarOpen
  const isHome = location.pathname === '/'
  const toggle = () => uiDispatch({ type: isOpen ? 'CLOSE_SIDEBAR' : 'OPEN_SIDEBAR' })
  const close = useCallback(() => uiDispatch({ type: 'CLOSE_SIDEBAR' }), [uiDispatch])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, close])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  const handleNav = (path: string) => { close(); navigate(path) }
  const handleLogout = () => { close(); logout(); navigate('/login') }

  const avatar = authState.profile?.images[0]?.url

  return (
    <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
      {/* Hamburger button */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={toggle}
          className="p-2 glass rounded-xl hover:bg-black/5 transition-colors"
          aria-label={t('nav.openMenu')}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex' }}
              >
                <X size={20} className="text-black/70" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex' }}
              >
                <Menu size={20} className="text-black/70" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Popover */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              role="menu"
              className="absolute top-[calc(100%+8px)] left-0 w-56 glass rounded-2xl shadow-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }}
              style={{ transformOrigin: 'top left' }}
            >
              {/* Profile header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black/40 font-bold text-sm flex-shrink-0">
                    {authState.profile?.display_name?.[0] ?? '?'}
                  </div>
                )}
                <span className="text-sm font-semibold text-black truncate">
                  {authState.profile?.display_name ?? ''}
                </span>
              </div>

              {/* Nav items */}
              <div className="flex flex-col py-1.5">
                <button
                  role="menuitem"
                  onClick={() => handleNav('/favorites')}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left w-full"
                >
                  <Heart size={16} className="text-black/50 flex-shrink-0" />
                  <span className="text-sm text-black/70">{t('nav.favorites')}</span>
                </button>

                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left w-full"
                >
                  <LogOut size={16} className="text-black/50 flex-shrink-0" />
                  <span className="text-sm text-black/70">{t('nav.logout')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back button — hidden on home */}
      <AnimatePresence>
        {!isHome && (
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2 glass rounded-xl hover:bg-black/5 transition-colors"
            aria-label={t('nav.back', 'Voltar')}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeft size={20} className="text-black/70" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
