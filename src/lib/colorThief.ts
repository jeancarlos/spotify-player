// color-thief-ts requer um HTMLImageElement com crossOrigin definido antes do load.
// Esta função carrega a imagem, extrai a paleta de forma síncrona e retorna
// duas cores dominantes como strings rgb(), ou null em caso de falha.
export async function extractPalette(imageUrl: string): Promise<[string, string] | null> {
  try {
    const { default: ColorThief } = await import('color-thief-ts')
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = imageUrl
    })

    const thief = new ColorThief()
    const palette = thief.getPalette(img, 2) as number[][]

    return [
      `rgb(${palette[0][0]},${palette[0][1]},${palette[0][2]})`,
      `rgb(${palette[1][0]},${palette[1][1]},${palette[1][2]})`,
    ]
  } catch {
    return null
  }
}
