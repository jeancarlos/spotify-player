import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'

/**
 * QueryErrorHandler — mounts inside ToastProvider.
 * Listens to React Query's global mutation cache and query cache errors
 * and surfaces them as toast notifications.
 * Renders nothing.
 */
export function QueryErrorHandler() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (
        event.type === 'updated' &&
        event.query.state.status === 'error' &&
        event.query.state.fetchStatus === 'idle'
      ) {
        const err = event.query.state.error as { response?: { status: number } } | null
        // Don't toast on 401 — the axios interceptor handles auth refresh/redirect
        if (err?.response?.status === 401) return
        toast('Algo deu errado ao buscar os dados. Tente novamente.', 'error')
      }
    })
    return unsubscribe
  }, [queryClient, toast])

  return null
}
