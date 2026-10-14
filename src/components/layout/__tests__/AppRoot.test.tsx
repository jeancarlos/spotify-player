import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppRoot } from '../AppRoot'

let mockUnavailable = false
vi.mock('@/hooks/useCatalogHealth', () => ({
  useCatalogHealth: () => ({ unavailable: mockUnavailable }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../LyricsPreloader', () => ({ LyricsPreloader: () => <span data-testid="lyrics-preloader" /> }))
vi.mock('../QueryErrorHandler', () => ({ QueryErrorHandler: () => <span data-testid="query-errors" /> }))
vi.mock('@/components/vinyl/PersistentVinylDisk', () => ({
  PersistentVinylDisk: (props: { playerHovered?: boolean }) => (
    <span data-testid="vinyl" data-hovered={String(props.playerHovered)} />
  ),
}))
vi.mock('../MiniPlayer', () => ({
  MiniPlayer: (props: { onHoverChange?: (h: boolean) => void }) => (
    <aside
      data-testid="mini-player"
      onMouseEnter={() => {
        props.onHoverChange?.(true)
      }}
    />
  ),
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppRoot />}>
          <Route path="/player" element={<div />} />
          <Route path="*" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('AppRoot', () => {
  it('mounts the lyrics preloader, error toasts and catalog banner on /player', () => {
    mockUnavailable = true
    renderAt('/player')
    expect(screen.getByTestId('lyrics-preloader')).toBeInTheDocument()
    expect(screen.getByTestId('query-errors')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('catalog.unavailable')
  })

  it('hides the catalog banner while the catalog is available', () => {
    mockUnavailable = false
    renderAt('/player')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not raise the vinyl when the mini player is hovered', () => {
    mockUnavailable = false
    renderAt('/favorites')
    fireEvent.mouseEnter(screen.getByTestId('mini-player'))
    expect(screen.getByTestId('vinyl')).not.toHaveAttribute('data-hovered', 'true')
  })
})
