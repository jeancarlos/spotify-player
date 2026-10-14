import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_NOTE_LENGTH } from '@/utils/constants'

interface NoteEditorProps {
  note: string
  onSave: (note: string) => void
  onCancel: () => void
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(note)

  return (
    <form
      className="flex items-center gap-2 px-3 pb-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(value.trim())
      }}
    >
      <input
        autoFocus
        value={value}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(e) => {
          setValue(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
        }}
        aria-label={t('favorites.noteLabel')}
        placeholder={t('favorites.notePlaceholder')}
        className="flex-1 min-w-0 px-3 py-2 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/60 outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus:bg-black/[0.08] transition-colors"
      />
      <button
        type="submit"
        className="tap-target px-3 py-2 bg-primary text-ink rounded-xl text-sm font-bold hover:bg-primary/85 transition-colors"
      >
        {t('favorites.saveNote')}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="tap-target px-3 py-2 rounded-xl text-sm font-medium text-black/60 hover:bg-black/5 transition-colors"
      >
        {t('favorites.cancel')}
      </button>
    </form>
  )
}
