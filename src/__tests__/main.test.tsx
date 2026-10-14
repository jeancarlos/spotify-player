import { describe, it, expect, vi, beforeEach } from 'vitest'

const render = vi.fn()
const createRoot = vi.fn(() => ({ render }))
const cleanupLegacyStorage = vi.fn()

vi.mock('react-dom/client', () => ({ default: { createRoot }, createRoot }))
vi.mock('../index.css', () => ({}))
vi.mock('@/lib/i18n', () => ({}))
vi.mock('../App', () => ({ default: () => null }))
vi.mock('@/utils/legacyCleanup', () => ({ cleanupLegacyStorage }))

describe('main', () => {
  beforeEach(() => {
    vi.resetModules()
    render.mockClear()
    createRoot.mockClear()
    cleanupLegacyStorage.mockClear()
    document.body.innerHTML = ''
  })

  it('cleans legacy storage and renders into #root', async () => {
    const el = document.createElement('div')
    el.id = 'root'
    document.body.append(el)
    await import('../main')
    expect(cleanupLegacyStorage).toHaveBeenCalledTimes(1)
    expect(createRoot).toHaveBeenCalledWith(el)
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('throws when #root is missing', async () => {
    await expect(import('../main')).rejects.toThrow('Root element not found')
    expect(render).not.toHaveBeenCalled()
  })
})
