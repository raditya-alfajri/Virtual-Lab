import type { Explanation, Result, Row, Value, World } from './types'

export const SHELF = 'shelf'

export function ok(
  world: World,
  extra: { record?: Row; explanation?: Explanation; hint?: string } = {},
): Result {
  return { world, ...extra }
}

export function reject(text: string): Result {
  return { reject: text }
}

export function num(w: World, id: string, key: string): number {
  return Number(w.items[id].state[key] ?? 0)
}

export function str(w: World, id: string, key: string): string {
  return String(w.items[id].state[key] ?? '')
}

export function bool(w: World, id: string, key: string): boolean {
  return w.items[id].state[key] === true
}

export function update(
  w: World,
  id: string,
  patch: Record<string, Value>,
): World {
  const item = w.items[id]
  return {
    ...w,
    items: {
      ...w.items,
      [id]: { ...item, state: { ...item.state, ...patch } },
    },
  }
}

export function moveTo(w: World, id: string, at: string): World {
  return { ...w, items: { ...w.items, [id]: { ...w.items[id], at } } }
}

export function itemsAt(w: World, at: string): string[] {
  return Object.keys(w.items).filter((id) => w.items[id].at === at)
}

export function round(x: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(x * f) / f
}

// Angka untuk siswa memakai koma desimal: fmt(0.25, 2) → '0,25'.
export function fmt(x: number, decimals: number): string {
  return x.toFixed(decimals).replace('.', ',')
}

export function mixColor(from: string, to: string, t: number): string {
  const k = Math.min(Math.max(t, 0), 1)
  const channel = (hex: string, i: number) =>
    parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const parts = [0, 1, 2].map((i) =>
    Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * k)
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${parts.join('').toUpperCase()}`
}

// Stopwatch: tap pertama mulai, tap kedua berhenti, tap ketiga kembali ke nol.
export const STOPWATCH_STATE = { running: false, elapsed: 0 }

export function pressStopwatch(w: World, id: string): World {
  if (bool(w, id, 'running')) return update(w, id, { running: false })
  if (num(w, id, 'elapsed') > 0) return update(w, id, { elapsed: 0 })
  return update(w, id, { running: true })
}

export function tickStopwatch(w: World, id: string, dt: number): World {
  if (!bool(w, id, 'running')) return w
  return update(w, id, { elapsed: num(w, id, 'elapsed') + dt })
}

export function stopwatchView(w: World, id: string) {
  const running = bool(w, id, 'running')
  const elapsed = num(w, id, 'elapsed')
  return {
    reading: `${fmt(elapsed, 2)} s`,
    action: running ? 'Berhenti' : elapsed > 0 ? 'Nol-kan' : 'Mulai',
  }
}
