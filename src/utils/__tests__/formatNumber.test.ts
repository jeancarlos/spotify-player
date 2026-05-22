import { describe, it, expect } from 'vitest'
import { formatNumber } from '../formatNumber'

describe('formatNumber', () => {
  it('mantém números abaixo de 1000 sem alteração', () => {
    expect(formatNumber(999)).toBe('999')
  })

  it('formata milhares com sufixo K', () => {
    expect(formatNumber(1500)).toBe('1.5K')
  })

  it('formata exatamente mil', () => {
    expect(formatNumber(1000)).toBe('1K')
  })

  it('formata milhões com sufixo M', () => {
    expect(formatNumber(2500000)).toBe('2.5M')
  })

  it('remove decimais desnecessários', () => {
    expect(formatNumber(2000000)).toBe('2M')
  })
})
