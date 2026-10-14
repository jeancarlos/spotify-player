import type { KeyboardEvent, Dispatch, SetStateAction } from 'react'
import type { Track } from '@/types/music'

interface UseKeyboardNavOptions {
  isOpen: boolean
  results: Track[]
  highlightIndex: number
  setHighlightIndex: Dispatch<SetStateAction<number>>
  onSelect: (track: Track) => void
  onClose: () => void
}

export function useKeyboardNav({
  isOpen,
  results,
  highlightIndex,
  setHighlightIndex,
  onSelect,
  onClose,
}: UseKeyboardNavOptions) {
  return (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose()
      setHighlightIndex(() => -1)
      return
    }
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < results.length) {
      e.preventDefault()
      onSelect(results[highlightIndex])
    }
  }
}
