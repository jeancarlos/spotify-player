import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { SpotifyTrack } from '@/types/spotify'

interface Props {
  tracks: SpotifyTrack[]
  activeTrackId?: string
}

export function TrackPopularityChart({ tracks, activeTrackId }: Props) {
  const data = tracks.map((t) => ({
    id: t.id,
    name: t.name.length > 22 ? t.name.slice(0, 22) + '…' : t.name,
    popularity: t.popularity ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.3)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.6)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as { name: string; popularity: number }
            return (
              <div className="bg-white border border-black/8 rounded-xl px-3 py-1.5 shadow-lg text-xs font-medium text-black/70">
                {d.name} — {d.popularity}
              </div>
            )
          }}
        />
        <Bar dataKey="popularity" radius={[0, 4, 4, 0]} maxBarSize={14}>
          {data.map((d) => (
            <Cell key={d.id} fill={d.id === activeTrackId ? '#1DB954' : 'rgba(0,0,0,0.12)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
