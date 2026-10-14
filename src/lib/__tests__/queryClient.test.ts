import { describe, it, expect } from 'vitest'
import { DeezerError } from '@/lib/deezer'
import { retryDelay, shouldRetry } from '../queryClient'

describe('queryClient retry', () => {
  it('never retries code 800', () => {
    expect(shouldRetry(0, new DeezerError(800, 'no data'))).toBe(false)
  })

  it('retries other errors twice', () => {
    expect(shouldRetry(0, new DeezerError(4, 'quota'))).toBe(true)
    expect(shouldRetry(1, new Error('x'))).toBe(true)
    expect(shouldRetry(2, new Error('x'))).toBe(false)
  })

  it('backs off exponentially up to 8 s', () => {
    expect([0, 1, 2, 3, 4].map(retryDelay)).toEqual([1000, 2000, 4000, 8000, 8000])
  })
})
