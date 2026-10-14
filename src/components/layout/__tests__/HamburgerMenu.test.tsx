import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

  it('gives the menu toggle a 44 px tap target', async () => {
    await open()
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveClass('tap-target')
  })

  it('links the source code in a new tab', async () => {
    await open()
    const link = screen.getByRole('link', { name: 'nav.sourceCode' })
    expect(link).toHaveAttribute('href', 'https://github.com/jeancarlos/vinyla-player-demo')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('closes when toggled again and when a link is chosen', async () => {
    await open()
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    await userEvent.click(screen.getByRole('link', { name: 'nav.favorites' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows a back button away from home that navigates back', async () => {
    render(
      <MemoryRouter initialEntries={['/', '/favorites']} initialIndex={1}>
        <UIProvider>
          <HamburgerMenu />
          <Routes>
            <Route path="*" element={null} />
          </Routes>
        </UIProvider>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
    })
  })

  it('hides the back button on home', () => {
    render(
      <MemoryRouter>
        <UIProvider>
          <HamburgerMenu />
        </UIProvider>
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
  })
})
