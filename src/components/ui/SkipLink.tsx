import { useTranslation } from 'react-i18next'

export function SkipLink() {
  const { t } = useTranslation()

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-6 focus:py-3 focus:bg-black focus:text-white focus:rounded-full focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#1DB954] transition-all"
    >
      {t('common.skipToContent', 'Pular para o conteúdo')}
    </a>
  )
}
