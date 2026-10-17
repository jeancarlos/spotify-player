import { describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCatalogHealth } from '../useCatalogHealth'
import { DeezerError } from '@/lib/deezer'

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useCatalogHealth(), { wrapper })
  return { client, result }
}

const DEEZER = { source: 'deezer' }
const fail = (
  client: QueryClient,
  key: string,
  error: Error = new DeezerError(-1, 'timeout'),
  meta: Record<string, unknown> = DEEZER
) =>
  act(async () => {
    await client
      .query({ queryKey: [key], meta, queryFn: () => Promise.reject(error) })
      .catch(() => undefined)
  })
const succeed = (client: QueryClient, key: string, meta: Record<string, unknown> = DEEZER) =>
  act(async () => {
    await client.query({ queryKey: [key], meta, queryFn: () => Promise.resolve(1), staleTime: 0 })
  })

describe('useCatalogHealth', () => {
  it('is available until the third consecutive Deezer failure', async () => {
    const { client, result } = setup()
    await fail(client, 'a')
    await fail(client, 'b')
    expect(result.current.unavailable).toBe(false)
    await fail(client, 'c')
    expect(result.current.unavailable).toBe(true)
  })

  it('treats code 800 as a reachable catalog', async () => {
    const { client, result } = setup()
    for (const key of ['a', 'b', 'c']) await fail(client, key, new DeezerError(800, 'no data'))
    expect(result.current.unavailable).toBe(false)
  })

  it('resets after one success', async () => {
    const { client, result } = setup()
    await fail(client, 'a')
    await fail(client, 'b')
    await fail(client, 'c')
    expect(result.current.unavailable).toBe(true)
    await succeed(client, 'd')
    expect(result.current.unavailable).toBe(false)
  })

  it('a success in between restarts the count', async () => {
    const { client, result } = setup()
    await fail(client, 'a')
    await fail(client, 'b')
    await succeed(client, 'd')
    await fail(client, 'c')
    expect(result.current.unavailable).toBe(false)
  })

  it('ignores errors that are not DeezerError', async () => {
    const { client, result } = setup()
    for (const key of ['a', 'b', 'c', 'd']) await fail(client, key, new Error('x'))
    expect(result.current.unavailable).toBe(false)
  })

  it('ignores queries not marked as Deezer in both directions', async () => {
    const { client, result } = setup()
    await fail(client, 'a')
    await fail(client, 'b')
    await fail(client, 'lyrics', new DeezerError(-1, 'timeout'), {})
    await succeed(client, 'track-wikipedia', {})
    await succeed(client, 'artist-bio', {})
    await fail(client, 'c')
    expect(result.current.unavailable).toBe(true)
  })

  it('ignores background Deezer queries', async () => {
    const { client, result } = setup()
    for (const key of ['a', 'b', 'c'])
      await fail(client, key, new DeezerError(-1, 'timeout'), { source: 'deezer', background: true })
    expect(result.current.unavailable).toBe(false)
  })
})
