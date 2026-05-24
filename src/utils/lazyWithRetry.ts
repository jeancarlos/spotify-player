import { lazy, type ComponentType } from 'react'

/**
 * Wraps React.lazy with automatic retry + page reload on chunk load failures.
 *
 * When a new deploy happens, old chunk filenames (with content hashes) become
 * stale. Users who had the app open before the deploy will try to load chunks
 * that no longer exist on the server, causing a "Failed to fetch dynamically
 * imported module" error.
 *
 * This utility:
 * 1. Retries the import up to `maxRetries` times with exponential backoff.
 * 2. If all retries fail, forces a full page reload (once) so the browser
 *    fetches fresh HTML with updated chunk references.
 * 3. Uses sessionStorage to prevent infinite reload loops.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  maxRetries = 2
): React.LazyExoticComponent<T> {
  return lazy(() => retryImport(importFn, chunkName, maxRetries))
}

async function retryImport<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  retriesLeft: number
): Promise<{ default: T }> {
  try {
    return await importFn()
  } catch (error) {
    if (retriesLeft > 0) {
      const delay = 1000 * (3 - retriesLeft)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryImport(importFn, chunkName, retriesLeft - 1)
    }

    const storageKey = `chunk-reload:${chunkName}`
    const hasReloaded = sessionStorage.getItem(storageKey)

    if (!hasReloaded) {
      sessionStorage.setItem(storageKey, '1')
      window.location.reload()
      return new Promise(() => { })
    }

    sessionStorage.removeItem(storageKey)
    throw error
  }
}
