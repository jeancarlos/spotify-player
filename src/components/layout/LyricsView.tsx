import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'

interface LyricsViewProps {
  lines: LyricLine[]
  progress: number
  duration: number
  onSeek?: (ms: number) => void
}

export function LyricsView({ lines, progress, onSeek }: LyricsViewProps) {
  // findLastIndex ensures we get the most recent line that has already started
  const activeIndex = lines.reduce((acc, line, i) => {
    if (line.time <= progress) return i
    return acc
  }, 0)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [translateY, setTranslateY] = useState(0)
  const [paddingH, setPaddingH] = useState(0)

  // Mede o container e atualiza paddingH. ResizeObserver garante atualização em rotação de tela.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const h = container.clientHeight
      if (h > 0) setPaddingH(h / 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Centraliza a linha ativa sempre que ela, o paddingH ou as linhas mudarem.
  useLayoutEffect(() => {
    const container = containerRef.current
    const el = activeRef.current
    if (!container || !el || container.clientHeight === 0) return
    
    // Pequeno delay para garantir que o DOM estabilizou
    const timeout = setTimeout(() => {
      const center = container.clientHeight / 2
      const elMid = el.offsetTop + el.clientHeight / 2
      setTranslateY(center - elMid)
    }, 50)

    return () => clearTimeout(timeout)
  }, [activeIndex, paddingH, lines])

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative">
      <motion.div
        className="absolute inset-x-0 flex flex-col items-center gap-6 px-8"
        animate={{ y: translateY }}
        transition={{ 
          type: 'spring',
          damping: 30,
          stiffness: 150,
          mass: 0.8
        }}
      >
        {/* Spacer superior — igual à meia altura do container, centraliza a primeira linha */}
        <div style={{ height: paddingH, flexShrink: 0 }} />

        {lines.map((line, i) => {
          const dist = Math.abs(i - activeIndex)
          const isActive = i === activeIndex
          return (
            <motion.div
              key={`${i}-${line.time}`}
              ref={isActive ? activeRef : undefined}
              animate={{
                opacity: isActive ? 1 : Math.max(0.12, 1 - dist * 0.22),
                scale: isActive ? 1.04 : 1,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onClick={() => onSeek?.(line.time)}
              className={`font-sans text-center leading-relaxed select-none transition-colors duration-300 ${
                isActive ? 'text-white font-bold text-xl' : 'text-white/60 text-base font-normal hover:text-white/90'
              } ${onSeek ? 'cursor-pointer' : ''}`}
            >
              {line.text}
            </motion.div>
          )
        })}

        {/* Spacer inferior — permite que a última linha também chegue ao centro */}
        <div style={{ height: paddingH, flexShrink: 0 }} />
      </motion.div>
    </div>
  )
}
