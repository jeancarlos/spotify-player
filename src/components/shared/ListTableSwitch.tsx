import { List, Table2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'table'

interface ListTableSwitchProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
  className?: string
}

export function ListTableSwitch({ view, onChange, className }: ListTableSwitchProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('inline-flex items-center gap-1 border border-black/15 rounded-full p-1 bg-white/60 backdrop-blur-sm', className)}>
      <button
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors',
          view === 'list'
            ? 'bg-black text-white'
            : 'text-black/40 hover:text-black'
        )}
      >
        <List size={13} />
        {t('common.list')}
      </button>
      <button
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors',
          view === 'table'
            ? 'bg-black text-white'
            : 'text-black/40 hover:text-black'
        )}
      >
        <Table2 size={13} />
        {t('common.table')}
      </button>
    </div>
  )
}
