import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '../toast'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

let api: ReturnType<typeof useToast>
function Grab() {
  api = useToast()
  return null
}

describe('toast', () => {
  it('renders messages inside a polite live region', () => {
    render(
      <ToastProvider>
        <Grab />
      </ToastProvider>
    )
    act(() => api.toast('Saved', 'success'))
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveTextContent('Saved')
  })

  it('announces errors through role=alert', () => {
    render(
      <ToastProvider>
        <Grab />
      </ToastProvider>
    )
    act(() => api.toast('Boom', 'error'))
    expect(screen.getByRole('alert')).toHaveTextContent('Boom')
  })

  it('gives the dismiss button an accessible name and dismisses', async () => {
    render(
      <ToastProvider>
        <Grab />
      </ToastProvider>
    )
    act(() => api.toast('Saved'))
    fireEvent.click(screen.getByRole('button', { name: 'common.dismissNotification' }))
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument())
  })

  it('clears pending timers on unmount', () => {
    const setSpy = vi.spyOn(globalThis, 'setTimeout')
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = render(
      <ToastProvider>
        <Grab />
      </ToastProvider>
    )
    act(() => api.toast('Saved'))
    const call = setSpy.mock.calls.findIndex(([, ms]) => ms === 4500)
    const timer: unknown = setSpy.mock.results[call]?.value
    expect(timer).toBeDefined()
    unmount()
    expect(clearSpy.mock.calls.some(([id]) => id === timer)).toBe(true)
  })

  it('does not re-render components that only call toast() when the list changes', () => {
    let renders = 0
    function Caller() {
      const { toast } = useToast()
      renders++
      return <button onClick={() => toast('x')}>go</button>
    }
    render(
      <ToastProvider>
        <Caller />
      </ToastProvider>
    )
    const before = renders
    fireEvent.click(screen.getByText('go'))
    fireEvent.click(screen.getByText('go'))
    expect(screen.getAllByText('x')).toHaveLength(2)
    expect(renders).toBe(before)
  })
})
