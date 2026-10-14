import { describe, it, expect } from 'vitest'
import { shuffled } from '../shuffled'

describe('shuffled', () => {
  it('returns a permutation and leaves the input untouched', () => {
    const input = Array.from({ length: 50 }, (_, i) => i)
    const out = shuffled(input)
    expect(out).not.toBe(input)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
    expect(input).toEqual(Array.from({ length: 50 }, (_, i) => i))
  })
})
