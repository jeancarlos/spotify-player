import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Home } from '../Home'
import { PlayerContext } from '@/contexts/PlayerContext'
import { initialPlayerState } from '@/contexts/playerReducer'
import { ToastProvider } from '@/components/ui/toast'
import i18n from '@/lib/i18n'
import type { Track } from '@/types/music'
const playTrack = vi.fn(() => Promise.resolve())
const recent = [
  { id: 'r1', uri: 'deezer:track:r1', name: 'Mock Track 1', artists: [], album: { images: [] } },
  { id: 'r2', uri: 'deezer:track:r2', name: 'Mock Track 2', artists: [], album: { images: [] } },
] as unknown as Track[]
const popular = Array.from({ length: 8 }, (_, i) => ({
  id: `p${i}`,
  uri: `deezer:track:p${i}`,
  name: `Popular ${i}`,
  is_playable: true,
  artists: [],
  album: { images: [] },
})) as unknown as Track[]
const popularPage = { items: popular, offset: 0, limit: 20, total: popular.length }
let chartData: typeof popularPage | undefined = popularPage
const useChartTracks = vi.fn((_enabled: boolean) => ({ data: chartData }))
vi.mock('@/hooks/queries/useChart', () => ({
  useChartTracks: (enabled: boolean) => useChartTracks(enabled),
}))

let unavailable = false
vi.mock('@/hooks/useCatalogHealth', () => ({
  useCatalogHealth: () => ({ unavailable }),
}))

beforeEach(() => {
  unavailable = false
  chartData = popularPage
  localStorage.setItem('spoter_recent_v1', JSON.stringify(recent))
})

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR')
})
function Where() {
  const l = useLocation()
  return <output data-testid="where">{l.pathname + l.search}</output>
}

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <PlayerContext.Provider
            value={{
              state: initialPlayerState,
              controls: {
                playTrack,
                toggle: () => undefined,
                next: () => undefined,
                previous: () => undefined,
                seek: () => undefined,
                setShuffle: () => undefined,
                cycleRepeat: () => undefined,
              },
            }}
          >
            <ToastProvider>
              <Home />
              <Where />
            </ToastProvider>
          </PlayerContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  )
}

function resize(w: number, h: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: w })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
}

describe('Página Home', () => {
  afterEach(() => {
    resize(1024, 768)
  })

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

  it('clicar num disco toca a faixa com a lista de recentes', async () => {
    renderHome()
    await userEvent.click(await screen.findByText('Mock Track 1'))
    expect(playTrack).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1' }),
      expect.arrayContaining([expect.objectContaining({ id: 'r2' })]),
      0
    )
  })

  it('shows recently played and skips the chart when there is history', async () => {
    renderHome()
    expect(await screen.findByText('Mock Track 1')).toBeInTheDocument()
    expect(screen.queryByText(/home\.popular/i)).toBeNull()
    expect(useChartTracks).toHaveBeenLastCalledWith(false)
  })

  it('shows five random popular tracks on a first visit', () => {
    localStorage.removeItem('spoter_recent_v1')
    renderHome()
    expect(screen.getByText(/home\.popular/i)).toBeInTheDocument()
    expect(screen.queryByText(/Tocadas Recentemente/i)).toBeNull()
    expect(screen.getAllByText(/^Popular \d$/)).toHaveLength(5)
    expect(useChartTracks).toHaveBeenLastCalledWith(true)
  })

  it('shows the search prompt in the hint slot above the vinyl when nothing was played', () => {
    chartData = undefined
    localStorage.removeItem('spoter_recent_v1')
    renderHome()
    const prompt = screen.getByText(/Digite para buscar/)
    expect(prompt.closest('.z-\\[4\\]')).not.toBeNull()
    expect(prompt.closest('.z-\\[5\\]')).toBeNull()
  })

  it('navigates to the artists page with the typed query', async () => {
    renderHome()
    await userEvent.type(screen.getByRole('textbox'), 'coldplay')
    await waitFor(
      () => {
        expect(screen.getByTestId('where').textContent).toBe('/artists?q=coldplay&tab=artist')
      },
      { timeout: 8000 }
    )
  })

  it('stays on the page when the query is blank', async () => {
    renderHome()
    await userEvent.type(screen.getByRole('textbox'), '   ')
    await new Promise((r) => setTimeout(r, 800))
    expect(screen.getByTestId('where').textContent).toBe('/')
  })

  it('shows the hint on a tall narrow screen', () => {
    resize(500, 2000)
    renderHome()
    expect(screen.getByText('home.hint')).toBeInTheDocument()
  })

  it('does not play when the catalog is unavailable', async () => {
    unavailable = true
    renderHome()
    playTrack.mockClear()
    await userEvent.click(await screen.findByText('Mock Track 1'))
    expect(playTrack).not.toHaveBeenCalled()
  })
})
