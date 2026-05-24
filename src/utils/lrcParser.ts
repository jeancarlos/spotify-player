import type { LyricLine } from '@/types/lyrics'

/**
 * Parses a string in LRC format into an array of LyricLine objects.
 * Handles single and multiple timestamps per line.
 */
export function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split('\n')
  const result: LyricLine[] = []

  // Regex to match timestamps like [mm:ss.xx], [mm:ss.xxx] or [mm:ss:xx]
  const timestampRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g

  for (const line of lines) {
    const timestamps: number[] = []
    let match

    // Extract all timestamps from the line
    while ((match = timestampRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const msPart = match[3]
      const milliseconds = parseInt(msPart.padEnd(3, '0'), 10)

      const timeInMs = minutes * 60 * 1000 + seconds * 1000 + milliseconds
      timestamps.push(timeInMs)
    }

    // The text is what remains after removing all timestamps
    const text = line.replace(timestampRegex, '').trim()

    // Add a LyricLine for each timestamp found (sometimes one line has multiple timestamps)
    for (const time of timestamps) {
      result.push({ time, text })
    }
  }

  // Sort by time as LRC might not be ordered or have multiple timestamps out of order
  return result.sort((a, b) => a.time - b.time)
}

/**
 * Fallback for plain text lyrics without timestamps.
 * Estimates timestamps based on total duration.
 */
export function parsePlainLyrics(text: string, durationMs: number): LyricLine[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const lineDuration = durationMs / lines.length
  return lines.map((text, i) => ({
    time: i * lineDuration,
    text,
  }))
}
