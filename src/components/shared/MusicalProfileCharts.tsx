import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { AudioFeatures } from '@/types/spotify'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A♭', 'B']

interface MusicalProfileChartsProps {
  features: AudioFeatures
  theme?: 'light' | 'dark'
}

export function MusicalProfileCharts({ features: f, theme = 'dark' }: MusicalProfileChartsProps) {
  const { t } = useTranslation()
  const dark = theme === 'dark'

  const labelColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'
  const gridColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const textColor = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.30)'
  const bgBar = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tooltipBg = dark ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.98)'
  const tooltipBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tooltipText = dark ? '#fff' : '#000'

  const keyLabel =
    f.key >= 0 ? `${KEY_NAMES[f.key]} ${f.mode === 1 ? t('track.major') : t('track.minor')}` : null

  const radarData = [
    { label: t('artistDetail.danceability'), v: Math.round(f.danceability * 100) },
    { label: t('artistDetail.energy'), v: Math.round(f.energy * 100) },
    { label: t('artistDetail.valence'), v: Math.round(f.valence * 100) },
    { label: t('artistDetail.acousticness'), v: Math.round(f.acousticness * 100) },
    { label: t('artistDetail.liveness'), v: Math.round(f.liveness * 100) },
  ]

  const featureBars = [
    {
      key: 'danceability',
      value: f.danceability,
      color: '#1DB954',
      label: t('artistDetail.danceability'),
    },
    { key: 'energy', value: f.energy, color: '#f97316', label: t('artistDetail.energy') },
    { key: 'valence', value: f.valence, color: '#fbbf24', label: t('track.valence') },
    {
      key: 'acousticness',
      value: f.acousticness,
      color: '#60a5fa',
      label: t('artistDetail.acousticness'),
    },
    { key: 'speechiness', value: f.speechiness, color: '#a78bfa', label: t('track.speechiness') },
    {
      key: 'instrumentalness',
      value: f.instrumentalness,
      color: '#34d399',
      label: t('track.instrumentalness'),
    },
    { key: 'liveness', value: f.liveness, color: '#fb7185', label: t('artistDetail.liveness') },
  ]

  return (
    <div className="w-full max-w-sm md:max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Radar */}
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4 text-center"
          style={{ color: textColor }}
        >
          {t('artistDetail.audioProfile')}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke={gridColor} radialLines={false} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: labelColor, fontSize: 9, fontWeight: 600 }}
            />
            <Radar
              dataKey="v"
              stroke="#1DB954"
              fill="#1DB954"
              fillOpacity={0.18}
              strokeWidth={1.5}
              animationBegin={200}
              animationDuration={900}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 10,
                fontSize: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
              itemStyle={{ color: tooltipText }}
              formatter={(v: number) => [`${v}%`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature bars */}
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4 text-center"
          style={{ color: textColor }}
        >
          {t('track.audioFeatures')}
        </p>
        <div className="flex flex-col gap-3">
          {featureBars.map(({ key, value, color, label }, i) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-medium" style={{ color: labelColor }}>
                  {label}
                </span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
                  {Math.round(value * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bgBar }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${value * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                  style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* BPM + Tonalidade + Compasso */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="flex flex-col p-2.5 rounded-xl" style={{ background: bgBar }}>
            <span
              className="text-[8px] uppercase tracking-widest font-bold mb-0.5"
              style={{ color: textColor }}
            >
              BPM
            </span>
            <span className="text-sm font-bold" style={{ color: dark ? '#fff' : '#000' }}>
              {Math.round(f.tempo)}
            </span>
          </div>
          <div className="flex flex-col p-2.5 rounded-xl" style={{ background: bgBar }}>
            <span
              className="text-[8px] uppercase tracking-widest font-bold mb-0.5"
              style={{ color: textColor }}
            >
              {t('track.key')}
            </span>
            <span className="text-sm font-bold" style={{ color: dark ? '#fff' : '#000' }}>
              {keyLabel ?? '—'}
            </span>
          </div>
          <div className="flex flex-col p-2.5 rounded-xl" style={{ background: bgBar }}>
            <span
              className="text-[8px] uppercase tracking-widest font-bold mb-0.5"
              style={{ color: textColor }}
            >
              {t('track.timeSignature')}
            </span>
            <span className="text-sm font-bold" style={{ color: dark ? '#fff' : '#000' }}>
              {f.time_signature}/4
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
