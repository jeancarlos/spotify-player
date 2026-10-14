import { describe, it, expect, vi } from 'vitest'
import type { KeyboardEvent } from 'react'
import type { Track } from '@/types/music'
import { useKeyboardNav } from '../useKeyboardNav'

const track = { id: 't1' } as Track

function setup(over: Partial<Parameters<typeof useKeyboardNav>[0]> = {}) {
  const opts = {
    isOpen: true,
    results: [track],
    highlightIndex: 0,
    setHighlightIndex: vi.fn<(u: unknown) => void>(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...over,
  }
  const press = (key: string) => {
    useKeyboardNav(opts)({
      key,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent<HTMLInputElement>)
  }
  return { opts, press }
}

describe('useKeyboardNav', () => {
  it('Enter selects the highlighted result', () => {
    const { opts, press } = setup()
    press('Enter')
    expect(opts.onSelect).toHaveBeenCalledWith(track)
  })

  it('Enter does nothing when the highlight is past the end of a shrunken list', () => {
    const { opts, press } = setup({ highlightIndex: 3 })
    press('Enter')
    expect(opts.onSelect).not.toHaveBeenCalled()
  })

  it('Enter does nothing with no highlight', () => {
    const { opts, press } = setup({ highlightIndex: -1 })
    press('Enter')
    expect(opts.onSelect).not.toHaveBeenCalled()
  })

  it('Escape closes even when there are no results', () => {
    const { opts, press } = setup({ results: [], highlightIndex: -1 })
    press('Escape')
    expect(opts.onClose).toHaveBeenCalled()
    expect(opts.setHighlightIndex).toHaveBeenCalled()
  })

  it('ArrowDown and ArrowUp clamp the highlight within the list', () => {
    const { opts, press } = setup({ results: [track, track] })
    press('ArrowDown')
    press('ArrowUp')
    const [down, up] = vi.mocked(opts.setHighlightIndex).mock.calls.map(([fn]: unknown[]) => fn as (i: number) => number)
    expect(down(0)).toBe(1)
    expect(down(1)).toBe(1)
    expect(up(1)).toBe(0)
    expect(up(0)).toBe(0)
  })

  it('ignores other keys and a closed list', () => {
    const a = setup()
    a.press('a')
    const b = setup({ isOpen: false })
    b.press('ArrowDown')
    expect(a.opts.setHighlightIndex).not.toHaveBeenCalled()
    expect(b.opts.setHighlightIndex).not.toHaveBeenCalled()
  })

  it('Escape resets the highlight', () => {
    const { opts, press } = setup()
    press('Escape')
    const reset = vi.mocked(opts.setHighlightIndex).mock.calls[0][0] as unknown as () => number
    expect(reset()).toBe(-1)
  })
})
