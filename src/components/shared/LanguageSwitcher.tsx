import { useTranslation } from 'react-i18next'
import { useUI } from '@/hooks/useUI'

const LANGUAGES = [
  { code: 'pt-BR', label: 'PT' },
  { code: 'en-US', label: 'EN' },
] as const

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { state, dispatch } = useUI()
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-center gap-1 border border-black/15 rounded-full p-1 bg-white/60 backdrop-blur-sm ${className}`}
      role="group"
      aria-label={t('nav.languageSwitcher')}
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: code })}
          aria-pressed={state.language === code}
          className={`px-3 py-1 rounded-full font-mono text-xs transition-colors ${
            state.language === code ? 'bg-black text-white' : 'text-black/40 hover:text-black'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
