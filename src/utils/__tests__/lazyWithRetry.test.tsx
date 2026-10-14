import { Component, Suspense, type ReactNode } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { lazyWithRetry } from '../lazyWithRetry'

describe('lazyWithRetry', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('clears the reload marker after a successful load', async () => {
    sessionStorage.setItem('chunk-reload:page', '1')
    const Page = lazyWithRetry(() => Promise.resolve({ default: () => <p>loaded</p> }), 'page')
    render(
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    )
    await screen.findByText('loaded')
    expect(sessionStorage.getItem('chunk-reload:page')).toBeNull()
  })
})

describe('lazyWithRetry failures', () => {
  const reload = vi.fn()

  beforeEach(() => {
    sessionStorage.clear()
    reload.mockClear()
    vi.useFakeTimers()
    vi.stubGlobal('location', { reload })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('retries with backoff, then reloads once and marks the chunk', async () => {
    const importFn = vi.fn(() => Promise.reject(new Error('boom')))
    const Page = lazyWithRetry(importFn, 'p')
    render(
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    )
    await vi.advanceTimersByTimeAsync(5000)
    expect(importFn).toHaveBeenCalledTimes(3)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('chunk-reload:p')).toBe('1')
  })

  it('throws and clears the marker when it already reloaded', async () => {
    sessionStorage.setItem('chunk-reload:p', '1')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
      state = { failed: false }
      static getDerivedStateFromError() {
        return { failed: true }
      }
      render() {
        return this.state.failed ? <p>failed</p> : this.props.children
      }
    }
    const Page = lazyWithRetry(() => Promise.reject(new Error('boom')), 'p', 0)
    render(
      <Boundary>
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      </Boundary>
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(screen.getByText('failed')).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('chunk-reload:p')).toBeNull()
    spy.mockRestore()
  })
})
