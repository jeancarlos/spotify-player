import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { saveLastSearch } from '@/utils/search'

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  localStorage.clear()
})

describe('blocked storage', () => {
  it('imports the UI state when reads throw', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const { initialUIState } = await import('../uiReducer')
    expect(initialUIState.language).toBe('pt-BR')
  })

  it('ignores a stored language outside the supported set', async () => {
    localStorage.setItem('spoter_lang', 'en')
    const { initialUIState } = await import('../uiReducer')
    expect(initialUIState.language).toBe('pt-BR')
  })

  it('renders the provider when writes throw', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    const { UIProvider } = await import('../UIContext')
    render(
      <UIProvider>
        <p>alive</p>
      </UIProvider>
    )
    expect(screen.getByText('alive')).toBeInTheDocument()
  })

  it('does not throw when saving the last search', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => {
      saveLastSearch('abba', 'artist')
    }).not.toThrow()
  })
})
