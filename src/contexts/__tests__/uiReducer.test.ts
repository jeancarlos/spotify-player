import { describe, it, expect } from 'vitest'
import { uiReducer, initialUIState } from '../uiReducer'

describe('uiReducer', () => {
  it('TOGGLE_SIDEBAR inverte sidebarCollapsed', () => {
    const s1 = uiReducer(initialUIState, { type: 'TOGGLE_SIDEBAR' })
    expect(s1.sidebarCollapsed).toBe(true)
    const s2 = uiReducer(s1, { type: 'TOGGLE_SIDEBAR' })
    expect(s2.sidebarCollapsed).toBe(false)
  })

  it('SET_LANGUAGE atualiza o idioma', () => {
    const state = uiReducer(initialUIState, { type: 'SET_LANGUAGE', payload: 'en-US' })
    expect(state.language).toBe('en-US')
  })
})
