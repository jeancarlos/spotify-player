import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../AppShell'

vi.mock('../HamburgerMenu', () => ({ HamburgerMenu: () => null }))
vi.mock('../ReloadPrompt', () => ({ ReloadPrompt: () => null }))
vi.mock('@/components/shared/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }))
vi.mock('@/components/ui/SkipLink', () => ({ SkipLink: () => null }))

const renderShell = () =>
  render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>
  )

describe('AppShell', () => {
  it('always shows the Deezer logo link', () => {
    renderShell()
    expect(screen.getByRole('link', { name: 'common.poweredByDeezer' })).toHaveAttribute(
      'href',
      'https://www.deezer.com'
    )
  })
})
