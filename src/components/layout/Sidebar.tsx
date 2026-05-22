import { NavLink } from 'react-router-dom'
import { Home, Mic2, User, Heart, ChevronLeft, ChevronRight, Globe, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useUI } from '@/hooks/useUI'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: Home, labelKey: 'nav.home', end: true },
  { to: '/artists', icon: Mic2, labelKey: 'nav.artists', end: false },
  { to: '/profile', icon: User, labelKey: 'nav.profile', end: false },
  { to: '/favorites', icon: Heart, labelKey: 'nav.favorites', end: false },
]

export function Sidebar() {
  const { t, i18n } = useTranslation()
  const { state, dispatch } = useUI()
  const { state: authState, logout } = useAuth()
  const collapsed = state.sidebarCollapsed

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  function toggleLanguage() {
    dispatch({
      type: 'SET_LANGUAGE',
      payload: i18n.language === 'pt-BR' ? 'en-US' : 'pt-BR',
    })
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="glass-card-md flex flex-col h-full py-4 px-2 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-2 mb-8', collapsed && 'justify-center')}>
        <span className="text-2xl font-bold text-primary">S</span>
        {!collapsed && <span className="font-bold tracking-tight text-lg">Spoter</span>}
      </div>

      {/* Navegação */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm',
                isActive
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-white/50 hover:text-white hover:bg-white/10',
                collapsed && 'justify-center'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Ações do rodapé */}
      <div className="flex flex-col gap-1">
        <button
          id="language-toggle"
          onClick={toggleLanguage}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm',
            collapsed && 'justify-center'
          )}
        >
          <Globe size={16} className="shrink-0" />
          {!collapsed && <span>{i18n.language === 'pt-BR' ? 'PT' : 'EN'}</span>}
        </button>

        {/* Profile com popup */}
        {authState.profile && (
          <div ref={profileRef} className="relative">
            <button
              id="profile-popup-trigger"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
              onClick={() => setProfileOpen(o => !o)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/80 text-xs transition-all w-full',
                collapsed && 'justify-center'
              )}
            >
              <img
                src={authState.profile.images[0]?.url ?? '/favicon.svg'}
                alt="avatar"
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
              {!collapsed && (
                <span className="truncate">{authState.profile.display_name}</span>
              )}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  id="profile-popup"
                  initial={{ opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onMouseEnter={() => setProfileOpen(true)}
                  onMouseLeave={() => setProfileOpen(false)}
                  className="absolute bottom-full left-full ml-2 mb-1 glass-card border border-white/10 rounded-2xl p-4 min-w-[220px] z-50 shadow-xl"
                >
                  {/* Avatar + nome */}
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={authState.profile.images[0]?.url ?? '/favicon.svg'}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {authState.profile.display_name}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {authState.profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-white/10 my-2" />

                  {/* Ações */}
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Toggle recolher */}
        <button
          id="sidebar-toggle"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">{t('nav.collapse')}</span>}
        </button>
      </div>
    </motion.aside>
  )
}
