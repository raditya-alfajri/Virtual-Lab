export function clampUnit(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/** The y of a liquid surface; `top` is where a full container reaches. */
export function levelToY(level: unknown, bottom: number, top: number): number {
  return bottom - clampUnit(level) * (bottom - top)
}

/** Reads the number from texts such as "12,3 s". */
export function secondsFromReading(reading: string | undefined): number {
  const n = Number.parseFloat((reading ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function stopwatchHandAngle(seconds: number): number {
  return (((seconds % 60) + 60) % 60) * 6
}

/** Splits a sticker text after its first word, as in "Air / jeruk". */
export function stickerLines(text: string): string[] {
  const [first = '', ...rest] = text.trim().split(/\s+/)
  return rest.length > 0 ? [first, rest.join(' ')] : [first]
}

/** `useId` output made safe for `url(#…)` references. */
export function svgId(reactId: string): string {
  return `asset-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}
