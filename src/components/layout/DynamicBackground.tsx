import { motion } from 'framer-motion'
import { usePlayer } from '@/hooks/usePlayer'

export function DynamicBackground() {
  const { state } = usePlayer()
  const { palette, isPlaying } = state

  const [primary, secondary] = palette ?? ['rgb(45,27,105)', 'rgb(22,33,62)']

  const gradient = isPlaying
    ? `radial-gradient(ellipse at 20% 50%, ${primary}55 0%, transparent 55%),
       radial-gradient(ellipse at 80% 50%, ${secondary}55 0%, transparent 55%),
       rgb(10,10,15)`
    : `radial-gradient(ellipse at 50% 50%, rgb(45,27,105)33 0%, transparent 65%),
       rgb(10,10,15)`

  return (
    <motion.div
      className="fixed inset-0 -z-10"
      animate={{ background: gradient }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'url(/noise.svg)', backgroundSize: '200px 200px' }}
      />
    </motion.div>
  )
}
