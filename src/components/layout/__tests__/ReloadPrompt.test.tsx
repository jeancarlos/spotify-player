import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/toast'
import { ReloadPrompt } from '../ReloadPrompt'

const setOfflineReady = vi.fn()
const setNeedRefresh = vi.fn()
const updateServiceWorker = vi.fn()
let swOptions: { onRegistered: (r?: { scope: string }) => void; onRegisterError: (e: unknown) => void }
let offlineReady = true
let needRefresh = false

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options: typeof swOptions) => {
    swOptions = options
    return {
      offlineReady: [offlineReady, setOfflineReady],
      needRefresh: [needRefresh, setNeedRefresh],
      updateServiceWorker,
    }
  },
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

  it('dismisses the card and reloads through the service worker', async () => {
    offlineReady = false
    needRefresh = true
    renderPrompt()
    await userEvent.click(screen.getByRole('button', { name: 'favorites.cancel' }))
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
    await userEvent.click(screen.getByRole('button', { name: /pwa\.reload/ }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('logs registration results', () => {
    offlineReady = false
    needRefresh = false
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderPrompt()
    swOptions.onRegistered({ scope: '/s' })
    swOptions.onRegistered(undefined)
    swOptions.onRegisterError('bad')
    expect(warn).toHaveBeenCalledWith('SW Registered: /s')
    expect(warn).toHaveBeenCalledWith('SW Registered: unknown')
    expect(error).toHaveBeenCalledWith('SW registration error', 'bad')
    warn.mockRestore()
    error.mockRestore()
  })
})
