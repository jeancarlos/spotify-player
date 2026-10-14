import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScopedPage } from '../useScopedPage'

describe('useScopedPage', () => {
  it('goes back to page 1 when the scope changes', () => {
    const { result, rerender } = renderHook(({ id }) => useScopedPage(id), {
      initialProps: { id: 'a' },
    })
    act(() => {
      result.current[1]((p) => p + 1)
    })
    expect(result.current[0]).toBe(2)
    rerender({ id: 'b' })
    expect(result.current[0]).toBe(1)
    act(() => {
      result.current[1]((p) => p + 1)
    })
    expect(result.current[0]).toBe(2)
  })

  it('keeps the page while the scope stays', () => {
    const { result, rerender } = renderHook(({ id }) => useScopedPage(id), {
      initialProps: { id: 'a' },
    })
    act(() => {
      result.current[1](3)
    })
    rerender({ id: 'a' })
    expect(result.current[0]).toBe(3)
  })
})
