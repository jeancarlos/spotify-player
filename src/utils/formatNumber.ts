export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return `${parseFloat(v.toFixed(1))}M`
  }
  if (n >= 1_000) {
    const v = n / 1_000
    return `${parseFloat(v.toFixed(1))}K`
  }
  return n.toString()
}
