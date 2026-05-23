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
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const el = activeRef.current
    if (!container || !el) return
    const offset = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }, [activeIndex])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col items-center py-16 gap-5 px-8">
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
