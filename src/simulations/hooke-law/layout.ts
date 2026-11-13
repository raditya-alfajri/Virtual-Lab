import type { Motion, SceneLayout } from '../types'
import { PX_PER_M } from './scale'

// Stage is 1440 × 1024. The stand and the hanging board are drawn in the
// background.

/** The spring's top end on the clamp; the ruler's 0 cm lines up with it. */
const TOP = { x: 745, y: 190 }
const SPRING_W = 40
/** An unloaded spring is 10 cm long. */
const NATURAL = 0.1 * PX_PER_M

const SPRINGS = ['spring-a', 'spring-b']
const MASSES = Array.from({ length: 6 }, (_, i) => `mass-${i + 1}`)
const HANGER = { w: 60, h: 110 }
/** The hanger's plate, where the masses rest, is at y = 96 in its box. */
const PLATE_Y = 96
const MASS = { w: 60, h: 18 }

/** On the clamp, the spring hangs down as long as it is now. */
const springMotion: Motion = (base, { id, at, view }) => {
  if (at !== 'clamp') return {}
  const length = Number(view[id]?.length ?? 0.1) * PX_PER_M
  return {
    rect: { ...base, x: TOP.x - SPRING_W / 2, y: TOP.y, h: length },
    labelSide: 'left',
  }
}

/** The hanger hangs from the spring's lower end and moves down with it. */
const hangerMotion: Motion = (base, { at, parent }) =>
  SPRINGS.includes(at) && parent
    ? {
        rect: {
          ...base,
          x: parent.x + parent.w / 2 - HANGER.w / 2,
          y: parent.y + parent.h - 3,
        },
        labelSide: 'left',
      }
    : {}

/** Masses on the hanger stack up from its plate. */
const massMotion: Motion = (base, { id, at, items, parent }) => {
  if (at !== 'hanger' || !parent) return {}
  const index = MASSES.filter((m) => items[m]?.at === 'hanger').indexOf(id)
  return {
    rect: {
      ...base,
      x: parent.x,
      y: parent.y + PLATE_Y - MASS.h * (index + 1),
    },
  }
}

export const hookeLawLayout: SceneLayout = {
  views: [
    {
      id: 'stand',
      label: 'Statif',
      region: { x: 580, y: 130, w: 420, h: 640 },
    },
    {
      id: 'tools',
      label: 'Pegas & beban',
      region: { x: 70, y: 50, w: 400, h: 700 },
    },
  ],
  home: {
    'spring-a': { x: 130, y: 92, w: SPRING_W, h: NATURAL },
    'spring-b': { x: 220, y: 92, w: SPRING_W, h: NATURAL },
    hanger: { x: 320, y: 90, ...HANGER },
    // Masses stacked on the table, the bottom one resting at y = 712.
    ...Object.fromEntries(
      MASSES.map((id, i) => [
        id,
        { x: 330, y: 712 - MASS.h * (i + 1), ...MASS },
      ]),
    ),
    ruler: { x: 1060, y: 240, w: 44, h: 470 },
  },
  zones: {
    clamp: { x: TOP.x - 30, y: TOP.y - 5, w: 60, h: NATURAL + 10 },
    // The ruler stands right of the spring, 0 cm (y = 10 on it) level with the top.
    'spring-side': { x: 800, y: TOP.y - 10, w: 44, h: 470 },
  },
  attach: {},
  motion: {
    ...Object.fromEntries(SPRINGS.map((id) => [id, springMotion])),
    hanger: hangerMotion,
    ...Object.fromEntries(MASSES.map((id) => [id, massMotion])),
  },
  labelSide: { ruler: 'right' },
}
