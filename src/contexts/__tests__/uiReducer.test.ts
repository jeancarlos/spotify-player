import { describe, it, expect } from 'vitest'
import { uiReducer, initialUIState } from '../uiReducer'

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
})
