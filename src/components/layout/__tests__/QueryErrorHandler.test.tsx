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

type Step = ['fail' | 'succeed' | 'remove', string]

async function run(steps: Step[]) {
  const client = setup()
  for (const [op, key] of steps) {
    if (op === 'fail') await fail(client, key)
    else if (op === 'succeed') await succeed(client, key)
    else client.removeQueries({ queryKey: [key] })
  }
}

describe('QueryErrorHandler', () => {
  it.each<[string, Step[], number]>([
    ['toasts once when the same query keeps failing', [['fail', 'a'], ['fail', 'a'], ['fail', 'a']], 1],
    ['toasts once for several queries failing in one episode', [['fail', 'a'], ['fail', 'b']], 1],
    ['toasts again after every failing query has recovered', [['fail', 'a'], ['succeed', 'a'], ['fail', 'a']], 2],
    [
      'does not end the episode while another query is still failing',
      [['fail', 'a'], ['fail', 'b'], ['succeed', 'a'], ['fail', 'a']],
      1,
    ],
    [
      'toasts again when a failed query is garbage collected without recovering',
      [['fail', 'a'], ['remove', 'a'], ['fail', 'b']],
      2,
    ],
  ])('%s', async (_name, steps, calls) => {
    await run(steps)
    expect(toast).toHaveBeenCalledTimes(calls)
  })

  it('ignores background queries', async () => {
    const client = setup()
    await client
      .query({ queryKey: ['bg'], meta: { background: true }, queryFn: () => Promise.reject(new Error('x')) })
      .catch(() => undefined)
    expect(toast).not.toHaveBeenCalled()
  })
})
