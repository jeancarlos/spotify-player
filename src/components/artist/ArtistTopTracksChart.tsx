import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  type TooltipProps,
} from 'recharts'
import type { SpotifyTrack } from '@/types/spotify'
import { toChartData, type ChartEntry } from './chartData'

interface Props {
  tracks: SpotifyTrack[]
  activeTrackId?: string
  onPlay?: (track: SpotifyTrack) => void
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t, i18n } = useTranslation()
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
              {e.rank.toLocaleString(i18n.language)}
            </p>
            <p className="text-[7px] uppercase tracking-widest text-black/30 mt-0.5">{t('artistDetail.deezerRank')}</p>
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
  const position = String(index + 1).padStart(2, '0')
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
        {position}
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
  const { i18n } = useTranslation()
  const chartData = useMemo(() => toChartData(tracks), [tracks])

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
            tick={false}
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

          <Bar
            dataKey="rank"
            shape={<RoundedBar />}
            cursor="pointer"
            maxBarSize={28}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            onClick={(entry: ChartEntry) => onPlay?.(entry.track)}
          >
            <LabelList
              dataKey="rank"
              position="right"
              formatter={(n: number) => n.toLocaleString(i18n.language)}
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
