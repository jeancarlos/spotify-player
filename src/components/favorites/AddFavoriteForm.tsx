import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { TrackAutocomplete } from './TrackAutocomplete'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface AddFavoriteFormProps {
  /** Lista de faixas já favoritadas, usada para detectar duplicatas */
  tracks: SpotifyTrack[]
  /** Chamado ao submeter; note é undefined quando vazio */
  onAdd: (track: SpotifyTrack, note?: string) => void
  /** Fecha o painel/modal após submissão ou cancelamento */
  onClose: () => void
}

type FormValues = { track: SpotifyTrack; note: string }

export function AddFavoriteForm({ tracks, onAdd, onClose }: AddFavoriteFormProps) {
  const { t } = useTranslation()

  // Schema recriado quando t muda (troca de idioma em runtime)
  const schema = useMemo(
    () =>
      z.object({
        track: z.custom<SpotifyTrack>(
          (val) => val !== null && typeof val === 'object' && 'uri' in val,
          { message: t('favorites.trackRequired') }
        ),
        note: z.string().max(300, t('favorites.noteTooLong')).default(''),
      }),
    [t]
  )

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { note: '' },
  })

  const watchedTrack = watch('track')
  const watchedNote = watch('note') ?? ''
  // Verifica se a faixa selecionada já é favorita (por URI único do Spotify)
  const isAlreadyFavorite =
    !!watchedTrack && tracks.some((tr) => tr.uri === watchedTrack.uri)
  const noteLength = watchedNote.length

  const onSubmit = handleSubmit(({ track, note }) => {
    onAdd(track, note.trim() || undefined)
    reset()
    onClose()
  })

  return (
    <form onSubmit={onSubmit} noValidate className="p-4 flex flex-col gap-4">
      <p className="text-xs font-semibold text-black/40 uppercase tracking-wide">
        {t('favorites.addHeading')}
      </p>

      {/* Campo: Música (autocomplete controlado via Controller) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-black/60">
          {t('favorites.trackLabel')}{' '}
          <span aria-hidden className="text-black/30">*</span>
        </label>
        <Controller
          name="track"
          control={control}
          render={({ field, fieldState }) => (
            <TrackAutocomplete
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

      {/* Campo: Nota pessoal (register direto, sem controlled overhead) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-black/60">
          {t('favorites.noteLabel')}
        </label>
        <textarea
          {...register('note')}
          placeholder={t('favorites.notePlaceholder')}
          maxLength={320}
          rows={2}
          className="w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          {errors.note ? (
            <p className="text-xs text-red-500">{errors.note.message}</p>
          ) : (
            <span />
          )}
          {/* Contador muda de cor ao ultrapassar 280 chars (aviso antecipado) */}
          <span
            className={cn(
              'text-[11px] tabular-nums',
              noteLength > 280 ? 'text-red-500' : 'text-black/30'
            )}
          >
            {t('favorites.noteCharsLeft', { count: noteLength })}
          </span>
        </div>
      </div>

      {/* Botão de submit — desabilitado se form inválido, submetendo ou duplicata */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting || isAlreadyFavorite}
        className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('favorites.addConfirm')}
      </button>
    </form>
  )
}
