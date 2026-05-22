import { NavLink } from 'react-router-dom'
import { Home, Mic2, User, Heart, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
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

        {authState.profile && !collapsed && (
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 text-xs transition-all"
          >
            <img
              src={authState.profile.images[0]?.url ?? '/favicon.svg'}
              alt="avatar"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="truncate">{authState.profile.display_name}</span>
          </button>
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
          {!collapsed && <span className="text-xs">Recolher</span>}
        </button>
      </div>
    </motion.aside>
  )
}
