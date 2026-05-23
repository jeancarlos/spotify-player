import { useLayoutEffect, useRef, useState } from 'react'
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

  // Centraliza a linha ativa sempre que ela ou o paddingH mudarem.
  useLayoutEffect(() => {
    const container = containerRef.current
    const el = activeRef.current
    if (!container || !el || container.clientHeight === 0) return
    const center = container.clientHeight / 2
    const elMid = el.offsetTop + el.clientHeight / 2
    setTranslateY(center - elMid)
  }, [activeIndex, paddingH])

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative">
      <motion.div
        className="absolute inset-x-0 flex flex-col items-center gap-5 px-8"
        animate={{ y: translateY }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Spacer superior — igual à meia altura do container, centraliza a primeira linha */}
        <div style={{ height: paddingH, flexShrink: 0 }} />

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
              className={`font-sans text-center leading-relaxed select-none ${
                isActive ? 'text-white font-bold text-xl' : 'text-white text-base font-normal'
              } ${onSeek ? 'cursor-pointer' : ''}`}
            >
              {line}
            </motion.div>
          )
        })}

        {/* Spacer inferior — permite que a última linha também chegue ao centro */}
        <div style={{ height: paddingH, flexShrink: 0 }} />
      </motion.div>
    </div>
  )
}
