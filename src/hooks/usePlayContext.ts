import { useCallback } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

export function usePlayContext() {
  const { dispatch } = usePlayer()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useCallback(
    async (contextUri: string) => {
      dispatch({ type: 'SET_PLAYING', payload: true })
      try {
        await api.put('/me/player/play', { context_uri: contextUri })
      } catch (err) {
        dispatch({ type: 'SET_PLAYING', payload: false })
        const status = (err as AxiosError).response?.status
        if (status === 404 || status === 403) toast(t('player.noActiveDevice'), 'info')
      }
    },
    [dispatch, toast, t]
  )
}
