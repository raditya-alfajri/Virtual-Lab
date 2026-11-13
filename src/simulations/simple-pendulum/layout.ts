import type { World } from '../../data/types'
import type { Motion, Point, Pull, Rect, SceneLayout } from '../types'
import { bobDiameter, PX_PER_M } from './scale'

// Stage is 1440 × 1024. The stand and the string board are drawn in the
// background.

/** Where the strings hang from the stand's clamp. */
export const PIVOT: Point = { x: 560, y: 140 }

const STRINGS = [20, 40, 60, 80, 100].map((cm) => ({ id: `string-${cm}`, cm }))
const BOBS = [50, 100, 200].map((mass) => ({
  id: `bob-${mass}`,
  d: bobDiameter(mass),
}))
const STRING_W = 20

const lengthPx = (string: string) =>
  (STRINGS.find((s) => s.id === string)?.cm ?? 0) * (PX_PER_M / 100)
const bobOn = (items: World['items'], string: string) =>
  BOBS.find((b) => items[b.id]?.at === string)?.id
const isString = (id: string | undefined) => id?.startsWith('string-') === true

const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * A w × h box hanging `offset` below the pivot, swung `angle` degrees about
 * the pivot (positive: to the right).
 */
function swing(angle: number, offset: number, w: number, h: number): Rect {
  const c = offset + h / 2
  const cx = PIVOT.x + c * Math.sin(rad(angle))
  const cy = PIVOT.y + c * Math.cos(rad(angle))
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

const HOME: Record<string, Rect> = {
  // Strings on the board, at half the stand's scale.
  ...Object.fromEntries(
    STRINGS.map((s, i) => [
      s.id,
      { x: 950 + i * 90 - STRING_W / 2, y: 76, w: STRING_W, h: s.cm * 2.5 },
    ]),
  ),
  // Bobs in a row on the table, their bottoms at y = 712.
  ...Object.fromEntries(
    BOBS.map((b, i) => [
      b.id,
      { x: 985 + i * 110, y: 712 - b.d - 10, w: b.d, h: b.d + 10 },
    ]),
  ),
  protractor: { x: 740, y: 596, w: 220, h: 118 },
  stopwatch: { x: 1290, y: 560, w: 130, h: 150 },
}

/** On the stand, a string hangs to scale and swings with its bob. */
const stringMotion: Motion = (_, { id, at, view, items }) => {
  if (at !== 'clamp') return {}
  const bob = bobOn(items, id)
  const angle = bob ? Number(view[bob]?.angle ?? 0) : 0
  return {
    rect: swing(angle, 0, STRING_W, lengthPx(id)),
    rotate: -angle,
    labelSide: 'left',
  }
}

const bobMotion: Motion = (base, { id, at, view, items, parent }) => {
  if (!isString(at)) return {}
  // On a string still on the board: hanging from its lower end.
  if (items[at]?.at !== 'clamp') {
    return parent
      ? {
          rect: {
            ...base,
            x: parent.x + parent.w / 2 - base.w / 2,
            y: parent.y + parent.h,
          },
        }
      : {}
  }
  const angle = Number(view[id]?.angle ?? 0)
  const length = lengthPx(at)
  return {
    rect: swing(angle, length, base.w, base.h),
    rotate: -angle,
    labelSide: 'right',
    // The Hentikan button holds still under the bob's resting point.
    action: swing(0, length, base.w, base.h),
  }
}

// On the stand, the protractor sits on the pivot and the stopwatch on the
// table next to the stand.
const STAND_SPOTS: Record<string, Rect> = {
  protractor: { x: PIVOT.x - 110, y: PIVOT.y - 4, w: 220, h: 118 },
  stopwatch: { x: 150, y: 556, w: 130, h: 150 },
}
const standMotion: Motion = (_, { id, at }) =>
  at === 'stand' ? { rect: STAND_SPOTS[id] } : {}

/**
 * A bob hanging on the stand is pulled aside: the value is the string's
 * angle from the vertical, rounded to a degree (positive: to the right).
 */
const pullFor = (bob: string): Pull => ({
  active: (items) => {
    const string = items[bob]?.at
    return isString(string) && items[string]?.at === 'clamp'
  },
  value: (point) =>
    Math.round(
      (Math.atan2(point.x - PIVOT.x, Math.max(point.y - PIVOT.y, 1)) * 180) /
        Math.PI,
    ),
})

export const simplePendulumLayout: SceneLayout = {
  views: [
    { id: 'stand', label: 'Statif', region: { x: 130, y: 70, w: 720, h: 690 } },
    {
      id: 'tools',
      label: 'Tali & bandul',
      region: { x: 710, y: 40, w: 720, h: 720 },
    },
  ],
  home: HOME,
  zones: {
    clamp: { x: 530, y: 120, w: 60, h: 90 },
    // The stand's rod and base, without the clamp.
    stand: { x: 310, y: 90, w: 220, h: 640 },
  },
  attach: {},
  motion: {
    ...Object.fromEntries(STRINGS.map((s) => [s.id, stringMotion])),
    ...Object.fromEntries(BOBS.map((b) => [b.id, bobMotion])),
    protractor: standMotion,
    stopwatch: standMotion,
  },
  pull: Object.fromEntries(BOBS.map((b) => [b.id, pullFor(b.id)])),
  labelSide: { protractor: 'left' },
}
