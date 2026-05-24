export function CardSkeleton() {
  return (
    <div className="relative aspect-square rounded-[6px] overflow-hidden animate-pulse bg-black/10 shadow-lg ring-1 ring-white/10">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5 flex flex-col gap-1">
        <div className="h-2 bg-white/20 rounded-full w-3/4" />
        <div className="h-1.5 bg-white/10 rounded-full w-1/2" />
      </div>
    </div>
  )
}
