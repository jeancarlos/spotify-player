import { motion } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'

const WINDOW = 4
const SLOT_OPACITY = [0.05, 0.1, 0.18, 0.35, 1.0, 0.35, 0.18, 0.1, 0.05]
const SLOT_BLUR = [4, 3, 2, 1, 0, 1, 2, 3, 4]

interface LyricsViewProps {
  lines: LyricLine[]
  progress: number
  onSeek?: (ms: number) => void
}

export function LyricsView({ lines, progress, onSeek }: LyricsViewProps) {
  if (lines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/20 text-sm">Sem letra disponível</p>
      </div>
    )
  }

  const foundIndex = lines.findLastIndex((line) => line.time <= progress)
  const activeIndex = Math.max(0, foundIndex)

  const slots = Array.from({ length: WINDOW * 2 + 1 }, (_, i) => {
    const lineIdx = activeIndex - WINDOW + i
    if (lineIdx < 0 || lineIdx >= lines.length) return null
    return lines[lineIdx]
  })

  return (
    <div className="h-full flex flex-col justify-center gap-6 px-8">
      {slots.map((line, i) => {
        const isActive = i === WINDOW

        return (
          <motion.div
            key={i}
            animate={{
              opacity: SLOT_OPACITY[i],
              filter: `blur(${SLOT_BLUR[i]}px)`,
            }}
            transition={{ duration: 0.3 }}
            onClick={line && onSeek ? () => onSeek(line.time) : undefined}
            className={`text-center leading-tight select-none line-clamp-2 ${
              isActive
                ? 'text-white font-bold text-2xl md:text-3xl'
                : 'text-white text-lg md:text-xl'
            } ${line && onSeek ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            {line?.text ?? ''}
          </motion.div>
        )
      })}
    </div>
  )
}
