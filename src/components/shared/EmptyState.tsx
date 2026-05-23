interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      {icon && <div className="text-black/20">{icon}</div>}
      <p className="text-sm font-mono text-black/30 text-center">{message}</p>
    </div>
  )
}
