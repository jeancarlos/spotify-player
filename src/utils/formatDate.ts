import i18n from '@/lib/i18n'

type Precision = 'year' | 'month' | 'day'

function inferPrecision(date: string): Precision {
  if (/^\d{4}$/.test(date)) return 'year'
  if (/^\d{4}-\d{2}$/.test(date)) return 'month'
  return 'day'
}

/**
 * Formats Spotify release_date respecting precision and active language.
 * date: 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD'
 */
export function formatDate(date: string, precision?: Precision): string {
  if (!date) return ''

  const prec = precision ?? inferPrecision(date)
  const locale = i18n.language

  if (prec === 'year') return date.slice(0, 4)

  const iso = prec === 'month' ? `${date}-01` : date
  const d = new Date(`${iso}T00:00:00Z`)
  if (isNaN(d.getTime())) return date

  const options: Intl.DateTimeFormatOptions =
    prec === 'month'
      ? { year: 'numeric', month: 'long', timeZone: 'UTC' }
      : { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }

  return new Intl.DateTimeFormat(locale, options).format(d)
}
