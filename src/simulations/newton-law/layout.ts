import type { Motion, Rect, SceneLayout } from '../types'

// Stage is 1440 × 1024. The track, its distance marks, and the wall shelf
// are drawn in the background.

/**
 * Track scale: 600 px per metre. The cart's front at the start sits on the
 * 0 m line (x = 390), so the sensor at 1 m is at x = 990.
 */
export const PX_PER_M = 600
const CART = { w: 150, h: 72 }
const START: Rect = { x: 240, y: 648, ...CART }

const WEIGHTS = [
  'weight-500-1',
  'weight-500-2',
  'weight-1000-1',
  'weight-1000-2',
]
const FANS = [2, 4, 6, 8, 10].map((f) => `fan-${f}`)

const LIGHT = { w: 56, h: 26 }
const HEAVY = { w: 56, h: 36 }

const HOME: Record<string, Rect> = {
  cart: { x: 1110, y: 562, ...CART },
  // Top shelf: fans; lower shelf: weights and the sensor.
  ...Object.fromEntries(
    FANS.map((id, i) => [id, { x: 104 + i * 100, y: 122, w: 80, h: 90 }]),
  ),
  'weight-500-1': { x: 112, y: 364, ...LIGHT },
  'weight-500-2': { x: 186, y: 364, ...LIGHT },
  'weight-1000-1': { x: 272, y: 354, ...HEAVY },
  'weight-1000-2': { x: 346, y: 354, ...HEAVY },
  sensor: { x: 520, y: 230, w: 60, h: 160 },
}

/** On the track, the cart moves its position (m) away from the start. */
const cartMotion: Motion = (base, { at, view }) =>
  at === 'track'
    ? {
        rect: {
          ...base,
          x: START.x + Number(view.cart?.position ?? 0) * PX_PER_M,
          y: START.y,
        },
      }
    : {}

/** Weights on the cart stack in two columns from the top of its body. */
const weightMotion: Motion = (base, { id, at, items, parent }) => {
  if (at !== 'cart' || !parent) return {}
  const loaded = WEIGHTS.filter((w) => items[w]?.at === 'cart')
  const index = loaded.indexOf(id)
  const column = index % 2
  const below = loaded
    .filter((_, i) => i < index && i % 2 === column)
    .reduce((sum, w) => sum + HOME[w].h, 0)
  return {
    rect: {
      ...base,
      x: parent.x + 16 + column * 62,
      y: parent.y + 12 - below - base.h,
    },
  }
}

export const newtonLawLayout: SceneLayout = {
  home: HOME,
  zones: {
    start: START,
    track: { x: 390, y: 640, w: 916, h: 96 },
    'sensor-1m': { x: 960, y: 560, w: 60, h: 160 },
  },
  // The fan sits behind the cart, blowing to the left.
  attach: Object.fromEntries(
    FANS.map((id) => [id, { cart: { x: -74, y: -26 } }]),
  ),
  motion: {
    cart: cartMotion,
    ...Object.fromEntries(WEIGHTS.map((id) => [id, weightMotion])),
  },
  // Weights stack on top of the cart, so its Lepas button goes in front.
  actionSide: { cart: 'right' },
}
