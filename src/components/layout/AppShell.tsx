import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatalogHealth } from '@/hooks/useCatalogHealth'
import { HamburgerMenu } from './HamburgerMenu'
import { LyricsPreloader } from './LyricsPreloader'
import { QueryErrorHandler } from './QueryErrorHandler'
import { ReloadPrompt } from './ReloadPrompt'
import { DeezerAttribution } from '@/components/shared/DeezerAttribution'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { SkipLink } from '@/components/ui/SkipLink'

export function AppShell() {
  const { t } = useTranslation()
  const { unavailable } = useCatalogHealth()
  return (
    <>
      <SkipLink />
      <LyricsPreloader />
      <QueryErrorHandler />
      <ReloadPrompt />
      {unavailable && (
        <p
          role="status"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] rounded-full bg-amber-100 px-4 py-2 text-center text-xs text-amber-900 shadow"
        >
          {t('catalog.unavailable')}
        </p>
      )}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <HamburgerMenu />
          <div className="fixed top-4 right-4 z-40 flex h-[38px] items-center gap-3">
            <DeezerAttribution />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main id="main-content" className="relative z-[1] h-full overflow-y-auto" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  )
}
