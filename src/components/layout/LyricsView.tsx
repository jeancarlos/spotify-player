import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'

interface LyricsViewProps {
  lines: LyricLine[]
  progress: number
  duration: number
  onSeek?: (ms: number) => void
}

export function LyricsView({ lines, progress, onSeek }: LyricsViewProps) {
  const foundIndex = lines.findLastIndex(line => line.time <= progress)
  const activeIndex = foundIndex === -1 ? 0 : foundIndex
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstRef = useRef(true)

  useEffect(() => {
    isFirstRef.current = true
  }, [lines])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const active = container.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // getBoundingClientRect é viewport-relativo, sempre correto independente do offsetParent
    const containerRect = container.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    const targetScrollTop =
      container.scrollTop +
      activeRect.top -
      containerRect.top -
      container.clientHeight / 2 +
      active.clientHeight / 2

    if (isFirstRef.current) {
      container.scrollTop = targetScrollTop
      isFirstRef.current = false
    } else {
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
    }
  }, [activeIndex])

  if (lines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/20 text-sm">Sem letra disponível</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto no-scrollbar">
      <div
        className="flex flex-col items-center gap-8"
        style={{ paddingTop: '50vh', paddingBottom: '50vh' }}
      >
        {lines.map((line, i) => {
          const isActive = i === activeIndex
          const dist = Math.abs(i - activeIndex)

          return (
            <motion.div
              key={`${i}-${line.time}`}
              data-active={isActive ? 'true' : undefined}
              animate={{
                opacity: isActive ? 1 : Math.max(0.1, 1 - dist * 0.25),
                scale: isActive ? 1.05 : 1,
                filter: isActive ? 'blur(0px)' : `blur(${Math.min(dist * 0.5, 2)}px)`,
              }}
              transition={{ duration: 0.4 }}
              onClick={() => onSeek?.(line.time)}
              className={`w-full max-w-lg px-8 font-sans text-center leading-tight select-none ${
                isActive
                  ? 'text-white font-bold text-2xl md:text-3xl'
                  : 'text-white/40 text-lg md:text-xl font-medium'
              } ${onSeek ? 'cursor-pointer hover:text-white/60' : ''}`}
            >
              {line.text}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
