import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { server } from '@/mocks/server'
import { Home } from '../Home'
import { PlayerContext } from '@/contexts/PlayerContext'
import { initialPlayerState } from '@/contexts/playerReducer'
import { ToastProvider } from '@/components/ui/toast'
import i18n from '@/lib/i18n'

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' })
  await i18n.changeLanguage('pt-BR')
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <PlayerContext.Provider value={{ state: initialPlayerState, dispatch: () => {} }}>
            <ToastProvider>
              <Home />
            </ToastProvider>
          </PlayerContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('Página Home', () => {
  it('renderiza o título da seção de tocadas recentemente', async () => {
    renderHome()
    expect(await screen.findByText(/Tocadas Recentemente/i)).toBeInTheDocument()
  })

  it('renderiza o nome de uma faixa do mock de tocadas recentemente', async () => {
    renderHome()
    expect(await screen.findByText('Mock Track 1')).toBeInTheDocument()
  })

  it('não renderiza botão de navegação "Anterior"', async () => {
    renderHome()
    await screen.findByText('Mock Track 1')
    expect(screen.queryByRole('button', { name: /anterior/i })).not.toBeInTheDocument()
  })

  it('não renderiza botão de navegação "Próximo"', async () => {
    renderHome()
    await screen.findByText('Mock Track 1')
    expect(screen.queryByRole('button', { name: /próximo/i })).not.toBeInTheDocument()
  })
})
