import { useSyncExternalStore } from 'react'
import { useQueryClient, type QueryCache } from '@tanstack/react-query'
import { DeezerError } from '@/lib/deezer'

const FAILURE_LIMIT = 3

interface HealthStore {
  failures: number
  listeners: Set<() => void>
}

const stores = new WeakMap<QueryCache, HealthStore>()

function storeFor(cache: QueryCache): HealthStore {
  const existing = stores.get(cache)
  if (existing) return existing
  const store: HealthStore = { failures: 0, listeners: new Set() }
  stores.set(cache, store)
  cache.subscribe((event) => {
    if (event.type !== 'updated' || event.query.meta?.source !== 'deezer') return
    const { action } = event
    const before = store.failures >= FAILURE_LIMIT
    if (
      action.type === 'success' ||
      (action.type === 'error' && action.error instanceof DeezerError && action.error.code === 800)
    )
      store.failures = 0
    else if (action.type === 'error' && action.error instanceof DeezerError) store.failures++
    else return
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
