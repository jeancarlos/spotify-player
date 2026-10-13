import { Suspense } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
