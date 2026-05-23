import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface LyricsViewProps {
  lines: string[]
  progress: number
  duration: number
  onSeek?: (ms: number) => void
}

export function LyricsView({ lines, progress, duration, onSeek }: LyricsViewProps) {
  const activeIndex = duration > 0
    ? Math.max(0, Math.min(lines.length - 1, Math.floor((progress / duration) * lines.length)))
    : 0
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center py-16 gap-5 px-8">
      {lines.map((line, i) => {
        const dist = Math.abs(i - activeIndex)
        const isActive = i === activeIndex
        return (
          <motion.div
            key={i}
            ref={isActive ? activeRef : undefined}
            animate={{
              opacity: isActive ? 1 : Math.max(0.12, 1 - dist * 0.22),
              scale: isActive ? 1.04 : 1,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={() => onSeek?.(Math.round((i / lines.length) * duration))}
          className={`text-center leading-relaxed ${
              isActive
                ? 'text-white font-bold text-xl'
                : 'text-white text-base font-normal'
            } ${onSeek ? 'cursor-pointer hover:opacity-100' : ''}`}
          >
            {line}
          </motion.div>
        )
      })}
    </div>
  )
}
