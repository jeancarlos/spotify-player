declare module 'color-thief-ts' {
  export default class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): number[]
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): number[][]
  }
}

declare module '*.webp' {
  const content: string
  export default content
}
