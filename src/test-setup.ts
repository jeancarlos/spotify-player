import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        const translations: Record<string, string> = {
          'playlist.defaultName': 'Spoter List',
          'home.recentlyPlayed': 'Tocadas Recentemente',
          'artists.searchPrompt': 'Digite para buscar artistas',
          'common.back': 'Voltar',
          'nav.openMenu': 'Abrir menu',
        }

        let val = translations[key] || key
        if (options?.name) val = val.replace('{{name}}', options.name as string)
        return val
      },
      i18n: {
        changeLanguage: vi.fn(),
        language: 'pt-BR',
      },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn(),
    },
  }
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

window.ResizeObserver = ResizeObserver
export default ResizeObserver
