import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 0 20px 0 rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn('glass-card cursor-pointer p-3 select-none', className)}
    >
      {children}
    </motion.div>
  )
}
