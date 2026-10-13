import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { server } from '@/mocks/server'
import { deezer } from '@/lib/deezer'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { ToastProvider } from '@/components/ui/toast'
import searchArtist from '@/mocks/fixtures/deezer/search-artist.json'
import { Artists } from '../Artists'

vi.mock('@/lib/deezer', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  deezer: vi.fn(),
}))

const deezerMock = vi.mocked(deezer)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})
beforeEach(() => {
  localStorage.clear()
  deezerMock.mockReset()
  deezerMock.mockResolvedValue(searchArtist)
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

function renderArtists() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <ToastProvider>
            <PlayerProvider>
              <Artists />
            </PlayerProvider>
          </ToastProvider>
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
    fireEvent.change(input, { target: { value: 'coldplay' } })
    expect(
      (await screen.findAllByText(searchArtist.data[0]?.name ?? '', {}, { timeout: 3000 })).length
    ).toBeGreaterThan(0)
    expect(deezerMock).toHaveBeenCalledWith('search/artist', { q: 'coldplay', index: 0, limit: 20 })
  })

  it('shows search prompt when query is empty', () => {
    renderArtists()
    expect(screen.getByText(/Digite para buscar|Type to search/i)).toBeInTheDocument()
  })
})
