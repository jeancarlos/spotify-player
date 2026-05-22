import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserTopTracks, useUserTopArtistsFull } from '@/hooks/queries/useUserTopItems'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

const TIME_RANGES: { value: TimeRange; labelKey: string }[] = [
  { value: 'short_term', labelKey: 'profile.fourWeeks' },
  { value: 'medium_term', labelKey: 'profile.sixMonths' },
  { value: 'long_term', labelKey: 'profile.allTime' },
]

export function Profile() {
  const { t } = useTranslation()
  const { state: auth } = useAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>('short_term')

  const topTracks = useUserTopTracks('short_term', 5)
  const topArtists = useUserTopArtistsFull(timeRange, 10)

  const trackIds = topTracks.data?.map(t => t.id) ?? []
  const audioFeatures = useAudioFeatures(trackIds)

  const radarData = useMemo(() => {
    if (!audioFeatures.data || audioFeatures.data.length === 0) return []
    const keys: (keyof typeof audioFeatures.data[0])[] = [
      'danceability', 'energy', 'valence', 'acousticness', 'speechiness',
    ]
    return keys.map(key => ({
      feature: key.charAt(0).toUpperCase() + key.slice(1),
      value: Number(
        (audioFeatures.data!.reduce((sum, f) => sum + (f[key] as number), 0) / audioFeatures.data!.length).toFixed(2)
      ),
    }))
  }, [audioFeatures.data])

  const barData = useMemo(
    () => (topArtists.data ?? []).map(a => ({ name: a.name.slice(0, 14), popularity: a.popularity })),
    [topArtists.data]
  )

  const albumCounts = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number }>()
    topTracks.data?.forEach(track => {
      const al = track.album
      const entry = map.get(al.id) ?? { name: al.name, image: al.images[0]?.url ?? '', count: 0 }
      entry.count++
      map.set(al.id, entry)
    })
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [topTracks.data])

  const profile = auth.profile

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <div className="glass-card p-6 flex items-center gap-5">
        {profile?.images[0]?.url ? (
          <img src={profile.images[0].url} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">
            {profile?.display_name?.[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
          <p className="text-sm text-white/50">{profile?.email}</p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-white/40">
              {profile?.followers.total} {t('profile.followers')}
            </span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              profile?.product === 'premium' ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/10 text-white/50'
            )}>
              {profile?.product}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">{t('profile.audioProfile')}</h2>
        {audioFeatures.isPending || topTracks.isPending ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Radar dataKey="value" stroke="rgba(147,51,234,0.8)" fill="rgba(147,51,234,0.25)" />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-white/30 text-sm text-center py-8">Ouça mais músicas para ver seu perfil</p>
        )}
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">{t('profile.topArtists')}</h2>
          <div className="flex glass-card-md rounded-xl overflow-hidden">
            {TIME_RANGES.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                className={cn(
                  'px-3 py-1.5 text-xs transition-colors',
                  timeRange === value ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
        {topArtists.isPending ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                itemStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Bar dataKey="popularity" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={`rgba(147,51,234,${0.4 + (barData.length - i) / barData.length * 0.5})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {albumCounts.length > 0 && (
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">{t('profile.mostPlayedAlbums')}</h2>
          <div className="space-y-2">
            {albumCounts.map(al => (
              <div key={al.name} className="flex items-center gap-3">
                {al.image && <img src={al.image} alt={al.name} className="w-10 h-10 rounded object-cover" />}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm truncate">{al.name}</p>
                </div>
                <span className="text-xs text-white/40 shrink-0">
                  {al.count} {t('profile.tracks')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
