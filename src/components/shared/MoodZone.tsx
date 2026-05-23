// src/components/shared/MoodZone.tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface MoodZoneProps {
  valence: number
  energy: number
  theme?: 'light' | 'dark'
  className?: string
}

export function MoodZone({ valence, energy, theme = 'dark', className }: MoodZoneProps) {
  const { t } = useTranslation()

  // Mood quadrant: x=valence (0=sad→1=happy), y=energy (0=chill→1=intense)
  const moodX = valence * 100   // % from left
  const moodY = (1 - energy) * 100 // % from top (inverted: high energy = top)

  const moodLabel = (() => {
    if (energy >= 0.5 && valence >= 0.5) return t('track.mood.happyEnergetic')
    if (energy >= 0.5 && valence < 0.5) return t('track.mood.darkEnergetic')
    if (energy < 0.5 && valence >= 0.5) return t('track.mood.happyChill')
    return t('track.mood.darkChill')
  })()

  const isDark = theme === 'dark'

  return (
    <div 
      className={cn(
        "relative w-full aspect-square max-w-[220px] mx-auto rounded-2xl overflow-hidden border",
        isDark ? "border-white/5" : "border-black/5",
        className
      )}
      style={{ 
        background: isDark 
          ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at center, rgba(0,0,0,0.02) 0%, transparent 70%)'
      }}
    >
      {/* Quadrant lines */}
      <div className="absolute inset-0 flex">
        <div className={cn("flex-1 border-r", isDark ? "border-white/10" : "border-black/10")} />
        <div className="flex-1" />
      </div>
      <div className="absolute inset-0 flex flex-col">
        <div className={cn("flex-1 border-b", isDark ? "border-white/10" : "border-black/10")} />
        <div className="flex-1" />
      </div>

      {/* Axis labels */}
      <span className={cn(
        "absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-semibold uppercase tracking-wider",
        isDark ? "text-white/25" : "text-black/30"
      )}>
        {t('track.intense')}
      </span>
      <span className={cn(
        "absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-semibold uppercase tracking-wider",
        isDark ? "text-white/25" : "text-black/30"
      )}>
        {t('track.chill')}
      </span>
      <span className={cn(
        "absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180",
        isDark ? "text-white/25" : "text-black/30"
      )}>
        {t('track.sad')}
      </span>
      <span className={cn(
        "absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]",
        isDark ? "text-white/25" : "text-black/30"
      )}>
        {t('track.happy')}
      </span>

      {/* Mood dot */}
      <motion.div
        className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ 
          left: `${moodX}%`, 
          top: `${moodY}%`, 
          background: '#1DB954', 
          boxShadow: isDark ? '0 0 12px rgba(29,185,84,0.7)' : '0 0 8px rgba(29,185,84,0.4)' 
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
      />
      {/* Dot crosshair */}
      <motion.div
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border",
          isDark ? "border-[#1DB954]/30" : "border-[#1DB954]/40"
        )}
        style={{ left: `${moodX}%`, top: `${moodY}%` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />

      {/* Mood label */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center">
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
          isDark ? "text-white/50 bg-black/40" : "text-black/50 bg-white/60 shadow-sm"
        )}>
          {moodLabel}
        </span>
      </div>
    </div>
  )
}
