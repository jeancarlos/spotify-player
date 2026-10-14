import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
