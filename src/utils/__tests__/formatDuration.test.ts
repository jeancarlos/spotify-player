import { describe, it, expect } from 'vitest'
import { formatDuration } from '../formatDuration'

describe('formatDuration', () => {
  it('formata segundos abaixo de um minuto', () => {
    expect(formatDuration(45000)).toBe('0:45')
  })

  it('formata exatamente um minuto', () => {
    expect(formatDuration(60000)).toBe('1:00')
  })

  it('formata minutos e segundos', () => {
    expect(formatDuration(210000)).toBe('3:30')
  })

  it('adiciona zero à esquerda nos segundos', () => {
    expect(formatDuration(63000)).toBe('1:03')
  })

  it('trata zero corretamente', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('trata durações longas (mais de uma hora em minutos)', () => {
    expect(formatDuration(3661000)).toBe('61:01')
  })
})
