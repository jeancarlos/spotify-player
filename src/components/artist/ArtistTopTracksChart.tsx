import { useEffect, useMemo, useState } from 'react'
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
} from 'recharts'
import { isPlayable } from '@/lib/deezerMappers'
import type { SpotifyTrack } from '@/types/spotify'
import { toChartData, playEntry, chartLayout, type ChartEntry } from './chartData'
import { CustomTooltip } from './ArtistChartTooltip'

interface Props {
  tracks: SpotifyTrack[]
  activeTrackId?: string
  onPlay?: (track: SpotifyTrack) => void
}

interface TickProps {
  x?: number
  y?: number
  index?: number
  maxChars?: number
  payload?: { value: string }
}

function CustomYTick({ x = 0, y = 0, index = 0, maxChars = 20, payload }: TickProps) {
  const position = String(index + 1).padStart(2, '0')
  const raw = payload?.value ?? ''
  const name = raw.length > maxChars ? raw.slice(0, maxChars) + '…' : raw
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
  cursor?: string
}

function RoundedBar({ x = 0, y = 0, width = 0, height = 0, fill, cursor }: BarShapeProps) {
  if (width <= 2)
    return <rect x={x} y={y} width={width} height={height} fill={fill} cursor={cursor} />
  const r = Math.min(5, height / 2)
  return (
    <path
      d={`M${x},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x},${y + height} Z`}
      fill={fill}
      cursor={cursor}
    />
  )
}

function getBarFill(entryId: string, index: number, activeTrackId?: string): string {
  if (entryId === activeTrackId) return 'rgba(0,0,0,0.78)'
  if (index === 0) return 'rgba(0,0,0,0.52)'
  return `rgba(0,0,0,${Math.max(0.12, 0.42 - index * 0.03)})`
}

export function ArtistTopTracksChart({ tracks, activeTrackId, onPlay }: Props) {
  const { t, i18n } = useTranslation()
  const [vw, setVw] = useState(window.innerWidth)
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const layout = chartLayout(vw)
  const chartData = useMemo(() => toChartData(tracks), [tracks])

  if (chartData.length === 0) return null

  return (
    <>
      <div aria-hidden="true" style={{ width: '100%', height: chartData.length * 46 + 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={layout.margin}
          >
            <CartesianGrid horizontal={false} stroke="rgba(0,0,0,0.04)" />

            <XAxis type="number" tick={false} axisLine={false} tickLine={false} />

            <YAxis
              type="category"
              dataKey="label"
              width={layout.yAxisWidth}
              tick={<CustomYTick maxChars={layout.labelChars} />}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.025)', rx: 6 }} />

            <Bar
              dataKey="rank"
              shape={<RoundedBar />}
              maxBarSize={28}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              onClick={(entry: ChartEntry) => {
                playEntry(entry, onPlay)
              }}
            >
              <LabelList
                dataKey="rank"
                position="right"
                formatter={(n: number) => n.toLocaleString(i18n.language)}
                style={{ fontSize: 10, fill: 'rgba(0,0,0,0.38)', fontWeight: 700 }}
              />
              {chartData.map((entry, i) => {
                const fill = getBarFill(entry.id, i, activeTrackId)
                return (
                  <Cell
                    key={entry.id}
                    fill={fill}
                    cursor={isPlayable(entry.track) ? 'pointer' : 'default'}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only focus-within:not-sr-only focus-within:flex focus-within:flex-wrap focus-within:gap-2 focus-within:mt-2">
        {chartData.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              disabled={!isPlayable(entry.track)}
              onClick={() => {
                playEntry(entry, onPlay)
              }}
              className="px-2 py-1 rounded-lg bg-black/5 text-xs text-black/70 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none"
            >
              {t('player.playTrack', { name: entry.name })}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
