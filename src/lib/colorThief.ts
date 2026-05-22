export async function extractPalette(imageUrl: string): Promise<[string, string] | null> {
  try {
    // color-thief-ts exporta default class ColorThief
    // browser build expõe getPaletteAsync(url, count) — não requer manipulação de Image
    const { default: ColorThief } = await import('color-thief-ts')
    const thief = new ColorThief({ crossOrigin: true })
    const palette = await thief.getPaletteAsync(imageUrl, 2)

    return [
      `rgb(${palette[0][0]},${palette[0][1]},${palette[0][2]})`,
      `rgb(${palette[1][0]},${palette[1][1]},${palette[1][2]})`,
    ]
  } catch {
    return null
  }
}
