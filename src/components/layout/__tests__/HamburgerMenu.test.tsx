import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UIProvider } from '@/contexts/UIContext'
import { HamburgerMenu } from '../HamburgerMenu'

const open = async () => {
  render(
    <MemoryRouter>
      <UIProvider>
        <HamburgerMenu />
      </UIProvider>
    </MemoryRouter>
  )
  await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
}

describe('HamburgerMenu', () => {
  it('lists real links without claiming the menu role', async () => {
    await open()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('link', { name: 'nav.home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'nav.favorites' })).toHaveAttribute('href', '/favorites')
  })

  it('links the source code in a new tab', async () => {
    await open()
    const link = screen.getByRole('link', { name: 'nav.sourceCode' })
    expect(link).toHaveAttribute('href', 'https://github.com/jeancarlos/spotify-player')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
