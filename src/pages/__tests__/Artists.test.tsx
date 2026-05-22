import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { server } from '@/mocks/server'
import { Artists } from '../Artists'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderArtists() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <Artists />
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('Artists page', () => {
  it('renders search input', () => {
    renderArtists()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows artist results after typing a query', async () => {
    renderArtists()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Mock' } })
    expect(await screen.findByText('Mock Artist')).toBeInTheDocument()
  })

  it('shows search prompt when query is empty', () => {
    renderArtists()
    expect(screen.getByText(/Digite para buscar|Type to search/i)).toBeInTheDocument()
  })
})
