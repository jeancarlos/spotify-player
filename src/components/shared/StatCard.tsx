interface StatCardProps {
  value: string
  label?: string
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col p-3 rounded-xl bg-white/[0.04] border border-white/[0.05]">
      {label && (
        <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold mb-1">{label}</span>
      )}
      <span className="text-sm font-bold text-white truncate">{value}</span>
    </div>
  )
}
