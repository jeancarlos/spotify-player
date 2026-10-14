import { QueryClient } from '@tanstack/react-query'
import { DeezerError } from '@/lib/deezer'
import { TIME_5_MINUTES } from '@/utils/constants'

export const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof DeezerError && error.code === 800) && failureCount < 2

export const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TIME_5_MINUTES,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      retryDelay,
    },
  },
})
