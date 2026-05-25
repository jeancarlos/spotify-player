import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/hooks/queries/useNowPlaying', () => ({
  useNowPlaying: vi.fn().mockReturnValue({ data: null }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { isAuthenticated: true } }),
}))

import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useProgressEngine } from '../useProgressEngine'

describe('useProgressEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('returns 0 when no API data', () => {
    vi.mocked(useNowPlaying).mockReturnValue({ data: null } as ReturnType<typeof useNowPlaying>)
    const { result } = renderHook(() => useProgressEngine())
    expect(result.current.currentProgress).toBe(0)
  })

  it('returns baseProgress when paused', () => {
    const now = 1_000_000
    vi.setSystemTime(now)
    vi.mocked(useNowPlaying).mockReturnValue({
      data: { is_playing: false, progress_ms: 5000, timestamp: now },
    } as ReturnType<typeof useNowPlaying>)

    const { result } = renderHook(() => useProgressEngine())

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current.currentProgress).toBe(5000)
  })

  it('advances progress when playing', () => {
    const now = 1_000_000
    vi.setSystemTime(now)
    vi.mocked(useNowPlaying).mockReturnValue({
      data: { is_playing: true, progress_ms: 5000, timestamp: now },
    } as ReturnType<typeof useNowPlaying>)

    const { result } = renderHook(() => useProgressEngine())

    act(() => {
      vi.advanceTimersByTime(1)
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.currentProgress).toBeGreaterThanOrEqual(7000)
  })

  it('seekTo updates currentProgress immediately', () => {
    const now = 1_000_000
    vi.setSystemTime(now)
    vi.mocked(useNowPlaying).mockReturnValue({
      data: { is_playing: false, progress_ms: 5000, timestamp: now },
    } as ReturnType<typeof useNowPlaying>)

    const { result } = renderHook(() => useProgressEngine())

    act(() => {
      result.current.seekTo(30000)
    })

    expect(result.current.currentProgress).toBe(30000)
  })
})
