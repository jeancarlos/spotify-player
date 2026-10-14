import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UIProvider } from '@/contexts/UIContext'
import { LanguageSwitcher } from '../LanguageSwitcher'

describe('LanguageSwitcher', () => {
  it('gives both language buttons a 44 px tap target', () => {
    render(
      <UIProvider>
        <LanguageSwitcher />
      </UIProvider>
    )
    for (const name of ['PT', 'EN'])
      expect(screen.getByRole('button', { name })).toHaveClass('tap-target')
  })

  it('switches the language', () => {
    render(
      <UIProvider>
        <LanguageSwitcher className="x" />
      </UIProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group')).toHaveClass('x')
  })
})
