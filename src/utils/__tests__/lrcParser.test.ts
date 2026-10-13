import { describe, it, expect } from 'vitest'
import { parseLRC, parsePlainLyrics } from '@/utils/lrcParser'

describe('parseLRC', () => {
  it('parses basic LRC format correctly', () => {
    const lrc = '[00:01.00] Line 1\n[00:02.50] Line 2'
    const result = parseLRC(lrc)
    expect(result).toEqual([
      { time: 1000, text: 'Line 1' },
      { time: 2500, text: 'Line 2' },
    ])
  })

  it('handles multiple timestamps per line', () => {
    const lrc = '[00:01.00][00:05.00] Repeated line'
    const result = parseLRC(lrc)
    expect(result).toEqual([
      { time: 1000, text: 'Repeated line' },
      { time: 5000, text: 'Repeated line' },
    ])
  })

  it('handles milliseconds with 3 digits', () => {
    const lrc = '[00:01.123] Line'
    const result = parseLRC(lrc)
    expect(result[0].time).toBe(1123)
  })

  it('sorts lines by time', () => {
    const lrc = '[00:05.00] Second\n[00:01.00] First'
    const result = parseLRC(lrc)
    expect(result[0].text).toBe('First')
    expect(result[1].text).toBe('Second')
  })
})

describe('parseLRC without a fractional part', () => {
  it('parses [mm:ss] stamps', () => {
    expect(parseLRC('[00:12] Line one\n[01:05]Line two')).toEqual([
      { time: 12000, text: 'Line one' },
      { time: 65000, text: 'Line two' },
    ])
  })

  it('ignores metadata tags', () => {
    expect(parseLRC('[ar:Someone]\n[00:03]Hi')).toEqual([{ time: 3000, text: 'Hi' }])
  })
})

describe('parsePlainLyrics', () => {
  it('estimates timestamps correctly', () => {
    const text = 'Line 1\nLine 2'
    const durationMs = 10000
    const result = parsePlainLyrics(text, durationMs)
    expect(result).toEqual([
      { time: 0, text: 'Line 1' },
      { time: 5000, text: 'Line 2' },
    ])
  })
})
