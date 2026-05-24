import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/toast'

export function QueryErrorHandler() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only fire on the first error transition, not on every polling retry
      if (event.type !== 'updated') return
      if (!('action' in event) || (event.action as { type: string }).type !== 'error') return

      const err = event.query.state.error as { response?: { status: number } } | null
      // Don't toast on 401 — axios interceptor handles auth refresh/redirect
      if (err?.response?.status === 401) return
      toast(t('common.error'), 'error')
    })
    return unsubscribe
  }, [queryClient, toast, t])

  return null
}
