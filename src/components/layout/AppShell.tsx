import { Fragment, type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { HamburgerMenu } from './HamburgerMenu'
import { ReloadPrompt } from './ReloadPrompt'
import { DeezerAttribution } from '@/components/shared/DeezerAttribution'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { SkipLink } from '@/components/ui/SkipLink'

const HUE_SHIFT: Record<string, number> = { artists: 35, albums: 70, playlists: -40, favorites: 140 }

export function AppShell() {
  const section = useLocation().pathname.split('/')[1]
  const hueShift = { '--hue-shift': HUE_SHIFT[section] ?? 0 } as CSSProperties

  return (
    <>
      <SkipLink />
      <ReloadPrompt />
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        style={hueShift}
        aria-hidden="true"
      >
        {[1, 2, 3].map((n) => (
          <Fragment key={n}>
            <div className={`blob blob-${n}`} />
            <div className={`blob blob-${n} blob-tint`} />
          </Fragment>
        ))}
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
