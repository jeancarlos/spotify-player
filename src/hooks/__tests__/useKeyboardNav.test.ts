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
    setHighlightIndex: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...over,
  }
  const press = (key: string) => {
    useKeyboardNav(opts)({ key, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLInputElement>)
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
})
