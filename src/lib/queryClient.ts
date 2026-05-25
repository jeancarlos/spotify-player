import { QueryClient } from '@tanstack/react-query'
import { TIME_5_MINUTES } from '@/utils/constants'

interface MaybeAxiosError {
  response?: { status?: number; headers?: Record<string, string> }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TIME_5_MINUTES,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as MaybeAxiosError).response?.status
        if (status === 429) return failureCount < 2
        if (status && status < 500) return false
        return failureCount < 2
      },
      retryDelay: (_, error) => {
        const e = error as MaybeAxiosError
        if (e.response?.status === 429) {
          const after = Number(e.response.headers?.['retry-after'] ?? 5)
          return after * 1000
        }
        return 1000
      },
    },
  },
})
