import { useMemo } from 'react'
import { useForm, Controller, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { TrackAutocomplete } from './TrackAutocomplete'
import { cn } from '@/lib/utils'
import { MAX_NOTE_LENGTH } from '@/utils/constants'
import type { Track } from '@/types/music'

interface AddFavoriteFormProps {
  existingFavorites: Track[]
  onAdd: (track: Track, note?: string) => boolean
  onClose: () => void
}

interface FormValues {
  track: Track | undefined
  note: string
}

interface SubmittedValues {
  track: Track
  note: string
}

export function AddFavoriteForm({ existingFavorites, onAdd, onClose }: AddFavoriteFormProps) {
  const { t } = useTranslation()

  const schema = useMemo(
    () =>
      z.object({
        track: z.custom<Track>((val) => val !== null && typeof val === 'object' && 'uri' in val, {
          message: t('favorites.trackRequired'),
        }),
        note: z.string().max(MAX_NOTE_LENGTH, t('favorites.noteTooLong')),
      }),
    [t]
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues, unknown, SubmittedValues>({
    resolver: zodResolver(schema) as Resolver<FormValues, unknown, SubmittedValues>,
    mode: 'onChange',
    defaultValues: { note: '' },
  })

  const watchedTrack = useWatch({ control, name: 'track' })
  const watchedNote = useWatch({ control, name: 'note' })
  const isAlreadyFavorite =
    !!watchedTrack && existingFavorites.some((fav) => fav.uri === watchedTrack.uri)
  const noteLength = watchedNote.length

  const onSubmit = handleSubmit(({ track, note }) => {
    if (!onAdd(track, note.trim() || undefined)) return
    reset()
    onClose()
  })

  return (
    <form onSubmit={onSubmit} noValidate className="p-4 flex flex-col gap-4">
      <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">
        {t('favorites.addHeading')}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="favorite-track" className="text-xs font-medium text-black/60">
          {t('favorites.trackLabel')}{' '}
          <span aria-hidden className="text-black/60">
            *
          </span>
        </label>
        <Controller
          name="track"
          control={control}
          render={({ field, fieldState }) => (
            <TrackAutocomplete
              id="favorite-track"
              value={field.value ?? null}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        {isAlreadyFavorite && (
          <p className="text-xs text-amber-500 ml-1" role="alert">
            {t('favorites.alreadyFavorite')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="favorite-note" className="text-xs font-medium text-black/60">
          {t('favorites.noteLabel')}
        </label>
        <textarea
          id="favorite-note"
          {...register('note')}
          placeholder={t('favorites.notePlaceholder')}
          maxLength={MAX_NOTE_LENGTH}
          rows={2}
          className="w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/60 outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus:bg-black/[0.08] transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          {errors.note ? <p className="text-xs text-red-500">{errors.note.message}</p> : <span />}
          <span
            className={cn('text-xs tabular-nums', errors.note ? 'text-red-500' : 'text-black/60')}
          >
            {t('favorites.noteCharsLeft', { count: noteLength })}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting || isAlreadyFavorite}
        className="w-full py-2.5 bg-primary text-ink rounded-xl text-sm font-bold hover:bg-primary/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('favorites.addConfirm')}
      </button>
    </form>
  )
}
