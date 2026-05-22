declare module 'color-thief-ts' {
  export default class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): number[]
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): number[][]
  }
}
