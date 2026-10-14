import type { LyricLine } from '@/types/lyrics'

/**
 * Parses a string in LRC format into an array of LyricLine objects.
 * Handles single and multiple timestamps per line.
 */
export function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split('\n')
  const result: LyricLine[] = []

  const timestampRegex = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g

  for (const line of lines) {
    const timestamps: number[] = []
    let match

    while ((match = timestampRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const msPart = match[3]
      const milliseconds = msPart ? parseInt(msPart.padEnd(3, '0'), 10) : 0

      const timeInMs = minutes * 60 * 1000 + seconds * 1000 + milliseconds
      timestamps.push(timeInMs)
    }

    const text = line.replace(timestampRegex, '').trim()

    for (const time of timestamps) {
      result.push({ time, text })
    }
  }

  return result.sort((a, b) => a.time - b.time)
}

export function parsePlainLyrics(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}
