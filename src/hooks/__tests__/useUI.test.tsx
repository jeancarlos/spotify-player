import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useUI } from '../useUI'
import { UIContext } from '@/contexts/UIContext'

describe('useUI', () => {
  it('returns the context value', () => {
    const value = { state: { language: 'pt-BR' as const, sidebarOpen: false }, dispatch: vi.fn() }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UIContext.Provider value={value}>{children}</UIContext.Provider>
    )
    expect(renderHook(() => useUI(), { wrapper }).result.current).toBe(value)
  })

  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => renderHook(() => useUI())).toThrow('useUI must be used inside UIProvider')
    vi.restoreAllMocks()
  })
})
