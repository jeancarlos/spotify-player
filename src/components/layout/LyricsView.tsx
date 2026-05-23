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
  // Encontra o índice da linha ativa com base no progresso atual
  const activeIndex = lines.reduce((acc, line, i) => {
    if (line.time <= progress) return i
    return acc
  }, 0)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [translateY, setTranslateY] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Monitora o tamanho do container para saber onde é o centro
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      setContainerHeight(container.clientHeight)
    }

    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Calcula o deslocamento necessário para centralizar a linha ativa
  useLayoutEffect(() => {
    const container = containerRef.current
    const activeEl = activeRef.current

    if (!container || !activeEl || containerHeight === 0) return

    // O offsetTop é relativo ao motion.div (que é o offsetParent por ser absolute)
    // Queremos que (translateY + activeEl.offsetTop + activeEl.height/2) === containerHeight / 2
    const center = containerHeight / 2
    const activeMid = activeEl.offsetTop + activeEl.clientHeight / 2
    
    setTranslateY(center - activeMid)
  }, [activeIndex, containerHeight, lines])

  if (lines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/20 text-sm">Sem letra disponível</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative w-full">
      <motion.div
        className="absolute top-0 inset-x-0 flex flex-col items-center gap-8"
        style={{ 
          paddingTop: containerHeight / 2, 
          paddingBottom: containerHeight / 2 
        }}
        animate={{ y: translateY }}
        transition={{ 
          type: 'spring',
          damping: 25,
          stiffness: 120,
          mass: 1
        }}
      >
        {lines.map((line, i) => {
          const isActive = i === activeIndex
          const dist = Math.abs(i - activeIndex)
          
          return (
            <motion.div
              key={`${i}-${line.time}`}
              ref={isActive ? activeRef : undefined}
              animate={{
                opacity: isActive ? 1 : Math.max(0.1, 1 - dist * 0.25),
                scale: isActive ? 1.05 : 1,
                filter: isActive ? 'blur(0px)' : `blur(${Math.min(dist * 0.5, 2)}px)`,
              }}
              transition={{ duration: 0.4 }}
              onClick={() => onSeek?.(line.time)}
              className={`w-full max-w-lg px-8 font-sans text-center leading-tight select-none transition-colors duration-500 ${
                isActive 
                  ? 'text-white font-bold text-2xl md:text-3xl' 
                  : 'text-white/40 text-lg md:text-xl font-medium'
              } ${onSeek ? 'cursor-pointer hover:text-white/60' : ''}`}
            >
              {line.text}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
