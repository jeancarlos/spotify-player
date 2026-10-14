import { useEffect, type RefObject } from 'react'

export function usePopoverDismiss(
  isOpen: boolean,
  onClose: () => void,
  triggerRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const path = e.composedPath()
      const inside = [popoverRef.current, triggerRef.current].some((el) => el && path.includes(el))
      if (!inside) onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose, triggerRef, popoverRef])
}
