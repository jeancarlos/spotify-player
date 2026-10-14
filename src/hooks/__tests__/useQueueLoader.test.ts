import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQueueLoader } from '../useQueueLoader'
import type { PagingObject, Track } from '@/types/music'

const items = [{ id: '1' }] as unknown as Track[]
const page = { items, offset: 0, limit: 1000, total: 1, href: '', next: null, previous: null }

function loader(query: Partial<UseQueryResult<PagingObject<Track>>>) {
  const refetch = query.refetch ?? vi.fn()
  const { result } = renderHook(() =>
    useQueueLoader({ data: undefined, isError: false, ...query, refetch } as UseQueryResult<PagingObject<Track>>)
  )
  return { load: result.current, refetch }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useQueueLoader', () => {
  it('returns loaded items without refetching', async () => {
    const { load, refetch } = loader({ data: page })
    expect(await load()).toBe(items)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('gives up at once when the full list failed', async () => {
    const { load, refetch } = loader({ isError: true })
    expect(await load()).toBeUndefined()
    expect(refetch).not.toHaveBeenCalled()
  })

  it('joins the in-flight fetch', async () => {
    const refetch = vi.fn(() => Promise.resolve({ data: page }))
    const { load } = loader({ refetch } as never)
    expect(await load()).toBe(items)
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false })
  })

  it('falls back after three seconds when the fetch hangs', async () => {
    vi.useFakeTimers()
    const { load } = loader({ refetch: vi.fn(() => new Promise(() => undefined)) } as never)
    const pending = load()
    await vi.advanceTimersByTimeAsync(3000)
    expect(await pending).toBeUndefined()
  })
})
