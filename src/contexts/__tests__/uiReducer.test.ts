import { describe, it, expect, vi } from 'vitest'
import { uiReducer, initialUIState, type UIAction } from '../uiReducer'
import { STORAGE_KEYS } from '@/lib/storageKeys'

describe('uiReducer', () => {
  it('OPEN_SIDEBAR sets sidebarOpen to true', () => {
    const state = uiReducer(initialUIState, { type: 'OPEN_SIDEBAR' })
    expect(state.sidebarOpen).toBe(true)
  })

  it('CLOSE_SIDEBAR sets sidebarOpen to false', () => {
    const open = uiReducer(initialUIState, { type: 'OPEN_SIDEBAR' })
    const closed = uiReducer(open, { type: 'CLOSE_SIDEBAR' })
    expect(closed.sidebarOpen).toBe(false)
  })

  it('SET_LANGUAGE updates the language', () => {
    const state = uiReducer(initialUIState, { type: 'SET_LANGUAGE', payload: 'en-US' })
    expect(state.language).toBe('en-US')
  })

  it('returns the same state for an unknown action', () => {
    const state = uiReducer(initialUIState, { type: 'NOPE' } as unknown as UIAction)
    expect(state).toBe(initialUIState)
  })

  it('reads the stored language on module load, falling back when storage throws', async () => {
    localStorage.setItem(STORAGE_KEYS.language, 'en-US')
    vi.resetModules()
    expect((await import('../uiReducer')).initialUIState.language).toBe('en-US')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.resetModules()
    expect((await import('../uiReducer')).initialUIState.language).toBe('pt-BR')
    vi.restoreAllMocks()
    localStorage.clear()
  })
})
