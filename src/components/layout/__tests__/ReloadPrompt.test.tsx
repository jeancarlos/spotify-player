import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/toast'
import { ReloadPrompt } from '../ReloadPrompt'

const setOfflineReady = vi.fn()
let offlineReady = true
let needRefresh = false

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

const renderPrompt = () =>
  render(
    <ToastProvider>
      <ReloadPrompt />
    </ToastProvider>
  )

describe('ReloadPrompt', () => {
  it('announces offline readiness as a toast instead of a sticky card', () => {
    offlineReady = true
    needRefresh = false
    renderPrompt()
    expect(screen.getByRole('status')).toHaveTextContent('pwa.readyOffline')
    expect(setOfflineReady).toHaveBeenCalledWith(false)
    expect(screen.queryByRole('button', { name: 'favorites.cancel' })).toBeNull()
  })

  it('keeps the update card with a reload button', () => {
    offlineReady = false
    needRefresh = true
    renderPrompt()
    expect(screen.getByText('pwa.updateAvailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pwa\.reload/ })).toBeInTheDocument()
  })
})
