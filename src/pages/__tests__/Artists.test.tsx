import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { deezer } from '@/lib/deezer'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { ToastProvider } from '@/components/ui/toast'
import searchArtist from '@/mocks/fixtures/deezer/search-artist.json'
import searchAlbum from '@/mocks/fixtures/deezer/search-album.json'
import searchPlaylist from '@/mocks/fixtures/deezer/search-playlist.json'
import chartArtists from '@/mocks/fixtures/deezer/chart-artists.json'
import { Artists } from '../Artists'

vi.mock('@/lib/deezer', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  deezer: vi.fn(),
}))

const deezerMock = vi.mocked(deezer)

beforeEach(() => {
  localStorage.clear()
  deezerMock.mockReset()
  deezerMock.mockImplementation((path: string) =>
    Promise.resolve(path === 'chart/0/artists' ? chartArtists : searchArtist)
  )
})
function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.search}</output>
}

function renderArtists(entry = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[entry]}>
        <QueryClientProvider client={client}>
          <ToastProvider>
            <PlayerProvider>
              <Artists />
              <Where />
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

  it('offers a single next-page control for search results', async () => {
    renderArtists()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'coldplay' } })
    await screen.findAllByText(searchArtist.data[0]?.name ?? '', {}, { timeout: 3000 })
    expect(screen.getAllByRole('button', { name: /artists\.next/ })).toHaveLength(1)
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

  it('shows an empty message when the search has no results', async () => {
    deezerMock.mockResolvedValue({ data: [], total: 0 })
    renderArtists('/?q=zzz')
    expect(await screen.findByText('artists.noResults')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'artists.next' })).toBeNull()
  })

  it('renders nothing for the results when the request fails', async () => {
    deezerMock.mockRejectedValue(new Error('boom'))
    renderArtists('/?q=zzz')
    expect(await screen.findByText(/artists\.searchArtists/)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(/^artists\.result/)).toBeNull()
    })
    expect(screen.queryByText('artists.noResults')).toBeNull()
  })

  it('pages forward and back through the search results', async () => {
    deezerMock.mockResolvedValue({ ...searchArtist, total: 100 })
    renderArtists('/?q=coldplay&page=2')
    await screen.findAllByText(searchArtist.data[0]?.name ?? '', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'artists.next' }))
    await waitFor(() => {
      expect(screen.getByTestId('where').textContent).toContain('page=3')
    })
    await screen.findAllByText(searchArtist.data[0]?.name ?? '', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'artists.previous' }))
    await waitFor(() => {
      expect(screen.getByTestId('where').textContent).toContain('page=2')
    })
  })

  it('shows album search results on the album tab', async () => {
    deezerMock.mockResolvedValue(searchAlbum)
    renderArtists('/?q=x&tab=album')
    expect(
      (await screen.findAllByText(searchAlbum.data[0]?.title ?? '', {}, { timeout: 3000 })).length
    ).toBeGreaterThan(0)
  })

  it('shows playlist search results on the playlist tab', async () => {
    deezerMock.mockResolvedValue(searchPlaylist)
    renderArtists('/?q=x&tab=playlist')
    expect(
      (await screen.findAllByText(searchPlaylist.data[0]?.title ?? '', {}, { timeout: 3000 })).length
    ).toBeGreaterThan(0)
  })
})
