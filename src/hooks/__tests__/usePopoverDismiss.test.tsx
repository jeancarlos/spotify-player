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

  it('closes on Escape and ignores other keys', () => {
    const onClose = vi.fn()
    render(<Popover onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'a' })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('stays open on a press inside the trigger', () => {
    const onClose = vi.fn()
    render(<Popover onClose={onClose} />)
    fireEvent.mouseDown(screen.getByText('trigger'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does nothing while closed', () => {
    const onClose = vi.fn()
    function Closed() {
      const trigger = useRef<HTMLButtonElement>(null)
      const popover = useRef<HTMLDivElement>(null)
      usePopoverDismiss(false, onClose, trigger, popover)
      return <p>outside</p>
    }
    render(<Closed />)
    fireEvent.mouseDown(screen.getByText('outside'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('tolerates unattached refs', () => {
    const onClose = vi.fn()
    function Bare() {
      const trigger = useRef<HTMLButtonElement>(null)
      const popover = useRef<HTMLDivElement>(null)
      usePopoverDismiss(true, onClose, trigger, popover)
      return <p>outside</p>
    }
    render(<Bare />)
    fireEvent.mouseDown(screen.getByText('outside'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
