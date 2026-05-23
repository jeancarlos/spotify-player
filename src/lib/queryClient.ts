import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status: number } }).response?.status
        if (status && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
