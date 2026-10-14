import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('react-router-dom', () => ({
  RouterProvider: () => <div data-testid="router" />,
}))
vi.mock('@/router', () => ({ router: {} }))
vi.mock('@/lib/queryClient', async () => {
  const { QueryClient } = await import('@tanstack/react-query')
  return { queryClient: new QueryClient() }
})
vi.mock('@/contexts/UIContext', () => ({ UIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/contexts/PlayerContext', () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/ui/toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('App', () => {
  it('mounts the router inside the providers', () => {
    render(<App />)
    expect(screen.getByTestId('router')).toBeInTheDocument()
  })
})
