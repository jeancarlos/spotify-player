import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
