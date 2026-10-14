import { useSyncExternalStore } from 'react'
import { useQueryClient, type QueryCache, type QueryCacheNotifyEvent } from '@tanstack/react-query'
import { DeezerError, isNoData } from '@/lib/deezer'

const FAILURE_LIMIT = 3

interface HealthStore {
  failures: number
  listeners: Set<() => void>
}

type QueryAction = Extract<QueryCacheNotifyEvent, { type: 'updated' }>['action']

function nextFailures(action: QueryAction, failures: number): number | null {
  if (action.type === 'success') return 0
  if (action.type !== 'error' || !(action.error instanceof DeezerError)) return null
  return isNoData(action.error) ? 0 : failures + 1
}

function countsTowardHealth(meta: Record<string, unknown> | undefined): boolean {
  return meta?.source === 'deezer' && !meta.background
}

const stores = new WeakMap<QueryCache, HealthStore>()

function storeFor(cache: QueryCache): HealthStore {
  const existing = stores.get(cache)
  if (existing) return existing
  const store: HealthStore = { failures: 0, listeners: new Set() }
  stores.set(cache, store)
  cache.subscribe((event) => {
    if (event.type !== 'updated' || !countsTowardHealth(event.query.meta)) return
    const failures = nextFailures(event.action, store.failures)
    if (failures === null) return
    const before = store.failures >= FAILURE_LIMIT
    store.failures = failures
    if (before !== store.failures >= FAILURE_LIMIT)
      store.listeners.forEach((l) => {
        l()
      })
  })
  return store
}

export function useCatalogHealth(): { unavailable: boolean } {
  const store = storeFor(useQueryClient().getQueryCache())
  const unavailable = useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener)
      return () => store.listeners.delete(listener)
    },
    () => store.failures >= FAILURE_LIMIT
  )
  return { unavailable }
}
