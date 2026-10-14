import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useArtistsPage } from '../useArtistsPage'

vi.mock('@/lib/deezer', () => ({
  deezer: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}))

function render(search: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/artists${search}`]}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return renderHook(() => useArtistsPage(), { wrapper }).result.current
}

describe('useArtistsPage params', () => {
  it('clamps a non-numeric page to 1', () => {
    expect(render('?page=abc').page).toBe(1)
  })
  it('clamps page 0 and negatives to 1', () => {
    expect(render('?page=0').page).toBe(1)
    expect(render('?page=-5').page).toBe(1)
  })
  it('truncates a fractional page', () => {
    expect(render('?page=2.9').page).toBe(2)
  })
  it('falls back to artist for an unknown tab', () => {
    expect(render('?tab=bogus').tab).toBe('artist')
  })
  it('keeps a valid tab', () => {
    expect(render('?tab=album').tab).toBe('album')
  })
  it('treats a whitespace-only query as empty', () => {
    expect(render('?q=%20%20').query).toBe('')
  })
})

describe('useArtistsPage saved search and handlers', () => {
  afterEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  function setup(search: string) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/artists${search}`]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
    return renderHook(() => ({ page: useArtistsPage(), loc: useLocation() }), { wrapper })
  }

  it('falls back to the last saved search', () => {
    localStorage.setItem('last-search', JSON.stringify({ q: 'saved', tab: 'album' }))
    const { result } = setup('')
    expect(result.current.page.query).toBe('saved')
    expect(result.current.page.tab).toBe('album')
  })

  it('prefers the url over the saved search', () => {
    localStorage.setItem('last-search', JSON.stringify({ q: 'saved', tab: 'album' }))
    const { result } = setup('?q=url&tab=playlist')
    expect(result.current.page.query).toBe('url')
    expect(result.current.page.tab).toBe('playlist')
  })

  it('handleSearch resets to page 1', () => {
    const { result } = setup('?page=4')
    act(() => {
      result.current.page.handleSearch('abc', 'album')
    })
    expect(result.current.loc.search).toBe('?q=abc&tab=album&page=1')
  })

  it('handlePageChange scrolls main to the top when present', () => {
    const main = document.createElement('main')
    const scrollTo = vi.fn()
    main.scrollTo = scrollTo
    document.body.appendChild(main)
    const { result } = setup('?q=abc')
    act(() => {
      result.current.page.handlePageChange(3)
    })
    expect(result.current.loc.search).toBe('?q=abc&tab=artist&page=3')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('handlePageChange works without a main element', () => {
    const { result } = setup('?q=abc')
    act(() => {
      result.current.page.handlePageChange(2)
    })
    expect(result.current.loc.search).toBe('?q=abc&tab=artist&page=2')
  })

  it('reports no next page once the data has loaded', async () => {
    const { result } = setup('?q=abc')
    await waitFor(() => {
      expect(result.current.page.isLoading).toBe(false)
    })
    expect(result.current.page.hasNext).toBe(false)
  })
})
