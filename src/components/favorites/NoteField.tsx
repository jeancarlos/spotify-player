import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteFieldProps {
  uri: string
  note: string
  onSave: (uri: string, note: string) => void
}

export function NoteField({ uri, note, onSave }: NoteFieldProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note)

  const commit = () => {
    setEditing(false)
    onSave(uri, value.trim())
  }

  const cancel = () => setEditing(false)

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder={t('favorites.notePlaceholder')}
        className="text-[11px] text-black/60 bg-transparent border-b border-black/20 outline-none w-full py-0.5"
      />
    )
  }

  return (
    <div className="flex items-center gap-1 group/note min-w-0">
      {note && (
        <span className="text-[11px] text-black/40 italic truncate">{note}</span>
      )}
      <button
        type="button"
        onClick={() => { setValue(note); setEditing(true) }}
        aria-label={t('favorites.editNote')}
        className={cn(
          'p-0.5 text-black/20 hover:text-black/50 transition-all shrink-0',
          note
            ? 'opacity-0 group-hover/note:opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <Pencil size={10} />
      </button>
    </div>
  )
}
