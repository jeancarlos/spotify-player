import { describe, it, expect, vi } from 'vitest'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePopoverDismiss } from '../usePopoverDismiss'

function Popover({ onClose }: { onClose: () => void }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const [picked, setPicked] = useState(false)
  usePopoverDismiss(true, onClose, trigger, popover)
  return (
    <>
      <button ref={trigger}>trigger</button>
      <div ref={popover}>
        {picked ? (
          <span>chip</span>
        ) : (
          <button
            onMouseDown={() => {
              flushSync(() => {
                setPicked(true)
              })
            }}
          >
            option
          </button>
        )}
      </div>
      <p>outside</p>
    </>
  )
}

describe('usePopoverDismiss', () => {
  it('stays open when the pressed element unmounts inside the popover', () => {
    const onClose = vi.fn()
    render(<Popover onClose={onClose} />)
    fireEvent.mouseDown(screen.getByText('option'))
    expect(screen.getByText('chip')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on a press outside', () => {
    const onClose = vi.fn()
    render(<Popover onClose={onClose} />)
    fireEvent.mouseDown(screen.getByText('outside'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
