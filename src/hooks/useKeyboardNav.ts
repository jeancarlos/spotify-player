import type { KeyboardEvent, Dispatch, SetStateAction } from 'react'
import type { SpotifyTrack } from '@/types/spotify'

interface UseKeyboardNavOptions {
  isOpen: boolean
  results: SpotifyTrack[]
  highlightIndex: number
  setHighlightIndex: Dispatch<SetStateAction<number>>
  onSelect: (track: SpotifyTrack) => void
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
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      onSelect(results[highlightIndex])
    } else if (e.key === 'Escape') {
      onClose()
      setHighlightIndex(() => -1)
    }
  }
}
