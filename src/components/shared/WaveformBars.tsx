import { motion } from 'framer-motion'

const HEIGHTS = [0.45, 0.72, 1.0, 0.58, 0.85, 0.48, 0.9]

export function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 20 }}>
      {HEIGHTS.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-black/60"
          style={{ originY: 'center' }}
          animate={
            isPlaying
              ? { scaleY: [h, h * 0.25, h * 0.8, h * 0.4, h] }
              : { scaleY: 0.2 }
          }
          transition={
            isPlaying
              ? { duration: 0.7 + i * 0.09, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
          initial={{ scaleY: h }}
        />
      ))}
    </div>
  )
}
