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
import chartArtists from '@/mocks/fixtures/deezer/chart-artists.json'
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
  deezerMock.mockImplementation((path: string) =>
    Promise.resolve(path === 'chart/0/artists' ? chartArtists : searchArtist)
  )
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

  it('shows the artist chart when the query is empty', async () => {
    renderArtists()
    expect(screen.getByText(/artists\.charts/)).toBeInTheDocument()
    expect(await screen.findByText(chartArtists.data[0]?.name ?? '')).toBeInTheDocument()
    expect(deezerMock).toHaveBeenCalledWith('chart/0/artists', { limit: 20 })
    expect(deezerMock).not.toHaveBeenCalledWith('search/artist', expect.anything())
    expect(screen.queryByRole('button', { name: 'artists.next' })).not.toBeInTheDocument()
  })

  it('goes back to the chart when the query is cleared', async () => {
    renderArtists()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'coldplay' } })
    await screen.findAllByText(searchArtist.data[0]?.name ?? '', {}, { timeout: 3000 })
    fireEvent.change(input, { target: { value: '' } })
    expect(
      await screen.findByText(chartArtists.data[0]?.name ?? '', {}, { timeout: 3000 })
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
