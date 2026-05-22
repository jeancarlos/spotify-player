import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAuth()
  if (!state.isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
