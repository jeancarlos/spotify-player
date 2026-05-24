interface TrackRowSkeletonProps {
  count?: number
}

export function TrackRowSkeleton({ count = 6 }: TrackRowSkeletonProps) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl animate-pulse">
          <div className="w-9 h-9 rounded-lg bg-black/10 shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div
              className="h-3 rounded-full bg-black/10"
              style={{ width: `${55 + ((i * 17) % 35)}%` }}
            />
            <div
              className="h-2.5 rounded-full bg-black/[0.06]"
              style={{ width: `${30 + ((i * 11) % 25)}%` }}
            />
          </div>
          <div className="w-7 h-3 rounded-full bg-black/[0.06] shrink-0" />
        </div>
      ))}
    </div>
  )
}
