import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/toast'

export function QueryErrorHandler() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    const failing = new Set<string>()
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated') return
      const { queryHash } = event.query
      if (event.action.type === 'success') {
        failing.delete(queryHash)
        return
      }
      if (event.action.type !== 'error') return
      const first = failing.size === 0
      failing.add(queryHash)
      if (first) toast(t('common.error'), 'error')
    })
    return unsubscribe
  }, [queryClient, toast, t])

  return null
}
