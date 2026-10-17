import { describe, it, expect } from 'vitest'
import { formatDuration } from '../formatDuration'

describe('formatDuration', () => {
  it.each([
    ['formata segundos abaixo de um minuto', 45000, '0:45'],
    ['formata exatamente um minuto', 60000, '1:00'],
    ['formata minutos e segundos', 210000, '3:30'],
    ['adiciona zero à esquerda nos segundos', 63000, '1:03'],
    ['trata zero corretamente', 0, '0:00'],
    ['trata durações longas (mais de uma hora)', 3661000, '1:01:01'],
    ['trata exatamente uma hora', 3600000, '1:00:00'],
  ])('%s', (_name, ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })
})
