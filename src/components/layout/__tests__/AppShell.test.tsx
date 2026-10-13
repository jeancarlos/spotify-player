import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../AppShell'

let mockUnavailable = false
vi.mock('@/hooks/useCatalogHealth', () => ({
  useCatalogHealth: () => ({ unavailable: mockUnavailable }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../HamburgerMenu', () => ({ HamburgerMenu: () => null }))
vi.mock('../LyricsPreloader', () => ({ LyricsPreloader: () => null }))
vi.mock('../QueryErrorHandler', () => ({ QueryErrorHandler: () => null }))
vi.mock('../ReloadPrompt', () => ({ ReloadPrompt: () => null }))
vi.mock('@/components/shared/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }))
vi.mock('@/components/ui/SkipLink', () => ({ SkipLink: () => null }))

const renderShell = () =>
  render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>
  )

describe('AppShell catalog banner', () => {
  it('shows a status banner only while the catalog is unavailable', () => {
    mockUnavailable = false
    const { unmount } = renderShell()
    expect(screen.queryByRole('status')).toBeNull()
    unmount()
    mockUnavailable = true
    renderShell()
    expect(screen.getByRole('status')).toHaveTextContent('catalog.unavailable')
  })

  it('always shows the Deezer logo link', () => {
    mockUnavailable = false
    renderShell()
    expect(screen.getByRole('link', { name: 'common.poweredByDeezer' })).toHaveAttribute(
      'href',
      'https://www.deezer.com'
    )
  })
})
