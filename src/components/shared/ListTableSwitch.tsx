import { List, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'table'

interface ListTableSwitchProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
  className?: string
}

export function ListTableSwitch({ view, onChange, className }: ListTableSwitchProps) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 p-1 bg-black/5 rounded-xl', className)}>
      <button
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
          view === 'list'
            ? 'bg-white shadow-sm text-black'
            : 'text-black/40 hover:text-black/70'
        )}
      >
        <List size={13} />
        Lista
      </button>
      <button
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
          view === 'table'
            ? 'bg-white shadow-sm text-black'
            : 'text-black/40 hover:text-black/70'
        )}
      >
        <Table2 size={13} />
        Tabela
      </button>
    </div>
  )
}
