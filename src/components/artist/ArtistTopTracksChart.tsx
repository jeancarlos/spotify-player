import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
  ReferenceLine,
  type TooltipProps,
} from 'recharts'
import type { SpotifyTrack } from '@/types/spotify'

function seededFraction(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return (Math.abs(h) % 1000) / 1000
}

function estimateStreams(popularity: number, trackId: string): number {
  const base = popularity > 0 ? popularity : Math.round(15 + seededFraction(trackId) * 30)
  return Math.round(50_000 + (base / 100) ** 2 * 4_950_000)
}

function formatStreams(n: number | undefined): string {
  if (n === undefined) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

interface ChartEntry {
  id: string
  label: string
  name: string
  artists: string
  albumName: string
  albumArt: string
  streams: number
  popularity: number
  track: SpotifyTrack
}

interface Props {
  tracks: SpotifyTrack[]
  activeTrackId?: string
  onPlay?: (track: SpotifyTrack) => void
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) return null
  const e = payload[0].payload as ChartEntry
  return (
    <div className="flex items-start gap-3 bg-white/96 backdrop-blur-sm border border-black/[0.07] rounded-2xl p-3 shadow-xl max-w-[260px] pointer-events-none">
      <img
        src={e.albumArt}
        alt=""
        className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-black leading-snug line-clamp-2">{e.name}</p>
        <p className="text-[10px] text-black/50 mt-0.5 truncate">{e.artists}</p>
        <p className="text-[9px] text-black/30 truncate mt-0.5 italic">{e.albumName}</p>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-black/[0.06]">
          <div>
            <p className="text-[13px] font-black tabular-nums text-black leading-none">
              {formatStreams(e.streams)}
            </p>
            <p className="text-[7px] uppercase tracking-widest text-black/30 mt-0.5">plays est.</p>
          </div>
          <div className="w-px h-5 bg-black/[0.08]" />
          <div>
            <p className="text-[13px] font-black tabular-nums text-black leading-none">
              {e.popularity}
            </p>
            <p className="text-[7px] uppercase tracking-widest text-black/30 mt-0.5">score</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TickProps {
  x?: number
  y?: number
  index?: number
  payload?: { value: string }
}

function CustomYTick({ x = 0, y = 0, index = 0, payload }: TickProps) {
  const rank = String(index + 1).padStart(2, '0')
  const raw = payload?.value ?? ''
  const name = raw.length > 20 ? raw.slice(0, 20) + '…' : raw
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={-8}
        textAnchor="end"
        fontSize={8}
        fill="rgba(0,0,0,0.25)"
        fontWeight={900}
        fontFamily="monospace"
        letterSpacing={1}
      >
        {rank}
      </text>
      <text x={-8} y={8} textAnchor="end" fontSize={11} fill="rgba(0,0,0,0.72)" fontWeight={600}>
        {name}
      </text>
    </g>
  )
}

interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
}

function RoundedBar({ x = 0, y = 0, width = 0, height = 0, fill }: BarShapeProps) {
  if (width <= 2) return <rect x={x} y={y} width={width} height={height} fill={fill} />
  const r = Math.min(5, height / 2)
  return (
    <path
      d={`M${x},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x},${y + height} Z`}
      fill={fill}
    />
  )
}

function getBarFill(entryId: string, index: number, activeTrackId?: string): string {
  if (entryId === activeTrackId) return 'rgba(0,0,0,0.78)'
  if (index === 0) return 'rgba(0,0,0,0.52)'
  return `rgba(0,0,0,${Math.max(0.12, 0.42 - index * 0.03)})`
}

export function ArtistTopTracksChart({ tracks, activeTrackId, onPlay }: Props) {
  const chartData = useMemo<ChartEntry[]>(() => {
    const sorted = [...tracks].slice(0, 10).sort((a, b) => b.popularity - a.popularity)
    return sorted.map((t) => ({
      id: t.id,
      label: t.name,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      albumName: t.album.name,
      albumArt: (t.album.images.at(1) ?? t.album.images.at(0))?.url ?? '',
      streams: estimateStreams(t.popularity, t.id),
      popularity: t.popularity,
      track: t,
    }))
  }, [tracks])

  const avgStreams = useMemo(
    () => Math.round(chartData.reduce((s, e) => s + e.streams, 0) / Math.max(chartData.length, 1)),
    [chartData]
  )

  if (chartData.length === 0) return null

  return (
    <div style={{ width: '100%', height: chartData.length * 46 + 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 4, left: 152 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(0,0,0,0.04)" />

          <XAxis
            type="number"
            tickFormatter={formatStreams}
            tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.3)' }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            type="category"
            dataKey="label"
            width={144}
            tick={<CustomYTick />}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.025)', rx: 6 }} />

          <ReferenceLine
            x={avgStreams}
            stroke="rgba(0,0,0,0.13)"
            strokeDasharray="4 3"
            label={{
              value: 'média',
              position: 'insideTopRight',
              fontSize: 8,
              fill: 'rgba(0,0,0,0.28)',
              dy: -4,
            }}
          />

          <Bar
            dataKey="streams"
            shape={<RoundedBar />}
            cursor="pointer"
            maxBarSize={28}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            onClick={(entry: ChartEntry) => onPlay?.(entry.track)}
          >
            <LabelList
              dataKey="streams"
              position="right"
              formatter={formatStreams}
              style={{ fontSize: 10, fill: 'rgba(0,0,0,0.38)', fontWeight: 700 }}
            />
            {chartData.map((entry, i) => {
              const fill = getBarFill(entry.id, i, activeTrackId)
              return <Cell key={entry.id} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
