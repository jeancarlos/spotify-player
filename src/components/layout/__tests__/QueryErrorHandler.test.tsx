import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QueryErrorHandler } from '../QueryErrorHandler'

const toast = vi.fn()
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast }) }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const setup = () => {
  toast.mockClear()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <QueryErrorHandler />
    </QueryClientProvider>
  )
  return client
}

const fail = (client: QueryClient, key: string) =>
  client.query({ queryKey: [key], queryFn: () => Promise.reject(new Error('x')) }).catch(() => undefined)
const succeed = (client: QueryClient, key: string) =>
  client.query({ queryKey: [key], queryFn: () => Promise.resolve(1), staleTime: 0 })

describe('QueryErrorHandler', () => {
  it('toasts once when the same query keeps failing', async () => {
    const client = setup()
    await fail(client, 'a')
    await fail(client, 'a')
    await fail(client, 'a')
    expect(toast).toHaveBeenCalledTimes(1)
  })

  it('toasts once for several queries failing in one episode', async () => {
    const client = setup()
    await fail(client, 'a')
    await fail(client, 'b')
    expect(toast).toHaveBeenCalledTimes(1)
  })

  it('toasts again after every failing query has recovered', async () => {
    const client = setup()
    await fail(client, 'a')
    await succeed(client, 'a')
    await fail(client, 'a')
    expect(toast).toHaveBeenCalledTimes(2)
  })

  it('does not end the episode while another query is still failing', async () => {
    const client = setup()
    await fail(client, 'a')
    await fail(client, 'b')
    await succeed(client, 'a')
    await fail(client, 'a')
    expect(toast).toHaveBeenCalledTimes(1)
  })

  it('toasts again when a failed query is garbage collected without recovering', async () => {
    const client = setup()
    await fail(client, 'a')
    client.removeQueries({ queryKey: ['a'] })
    await fail(client, 'b')
    expect(toast).toHaveBeenCalledTimes(2)
  })

  it('ignores background queries', async () => {
    const client = setup()
    await client
      .query({ queryKey: ['bg'], meta: { background: true }, queryFn: () => Promise.reject(new Error('x')) })
      .catch(() => undefined)
    expect(toast).not.toHaveBeenCalled()
  })
})
