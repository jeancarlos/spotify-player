import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  it('follows window resizes', () => {
    const { result } = renderHook(() => useWindowSize())
    act(() => {
      window.innerWidth = 321
      window.innerHeight = 654
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toEqual({ width: 321, height: 654 })
  })
})
