import { SHELF } from '../../lib/engine'
import type {
  Experiment,
  ItemDef,
  ItemView,
  Outcome,
  Result,
  World,
} from '../types'
import {
  bool,
  fmt,
  itemsAt,
  moveTo,
  num,
  ok,
  reject,
  round,
  toShelf,
  update,
} from './shared'

// Values from PRD section 7 (F3).
export const GRAVITY = 9.8 // m/s²
export const PIECE_MASS = 50 // g per slotted mass
export const MAX_LOAD = 250 // g, the elastic limit
// Not in the PRD; only for the ruler and the animation.
// TODO(cek guru): the spring's natural length, and the hanger's mass (taken as negligible).
export const NATURAL_LENGTH = 0.1 // m
export const SETTLE_SECONDS = 2 // how long the spring bounces before it rests
const DAMPING = 0.4 // s, time constant of the damped bounce

// F3 formulas.
export const weightForce = (grams: number, g = GRAVITY) => (grams / 1000) * g
export const extension = (force: number, k: number) => force / k
export const springConstant = (force: number, dx: number) => force / dx

const CLAMP = 'clamp'
const SIDE = 'spring-side'
const HANGER = 'hanger'
const RULER = 'ruler'

const RECORD_LINE = 'f3-recorded'

const SPRINGS = [
  { id: 'spring-a', name: 'Pegas A', k: 20 },
  { id: 'spring-b', name: 'Pegas B', k: 40 },
]
// Six masses, so the refusal above 250 g can be tried.
const MASSES = Array.from({ length: 6 }, (_, i) => `mass-${i + 1}`)

const springOf = (id: string) => SPRINGS.find((s) => s.id === id)!
const isSpring = (id: string) => SPRINGS.some((s) => s.id === id)

const STILL_SPRING = { from: 0, target: 0, t: 0, moving: false }

const massesOnHanger = (w: World) => itemsAt(w, HANGER).length
const hangerLoad = (w: World) => massesOnHanger(w) * PIECE_MASS

/** The load (g) pulling the spring: only when the hanger is on its end. */
export const springLoad = (w: World, spring: string) =>
  w.items[HANGER].at === spring ? hangerLoad(w) : 0

const clampedSpring = (w: World) => itemsAt(w, CLAMP).find(isSpring)

/** The current extension: a damped bounce towards the resting point. */
export function currentExtension(w: World, spring: string): number {
  const from = num(w, spring, 'from')
  const target = num(w, spring, 'target')
  if (!bool(w, spring, 'moving')) return target
  const t = num(w, spring, 't')
  const loadKg = Math.max(springLoad(w, spring), PIECE_MASS) / 1000
  const omega = Math.sqrt(springOf(spring).k / loadKg)
  const x =
    target + (from - target) * Math.exp(-t / DAMPING) * Math.cos(omega * t)
  return Math.max(x, 0)
}

/** The load changed: the spring bounces from its current length towards the new resting point. */
function relax(before: World, after: World, spring: string | undefined): World {
  if (!spring) return after
  const target = extension(
    weightForce(springLoad(after, spring)),
    springOf(spring).k,
  )
  const from = currentExtension(before, spring)
  if (from === target && !bool(before, spring, 'moving')) return after
  return update(after, spring, { from, target, t: 0, moving: true })
}

const loadedSpring = (w: World) => {
  const at = w.items[HANGER].at
  return isSpring(at) ? at : undefined
}

function measure(w: World, spring: string): Outcome {
  const grams = springLoad(w, spring)
  const { name, k } = springOf(spring)
  const force = weightForce(grams)
  const dx = extension(force, k)
  return ok(w, {
    record: {
      massa: grams,
      gaya: round(force, 2),
      pertambahan: round(dx, 4),
      konstanta: round(springConstant(force, dx), 1),
    },
    events: [{ type: 'record-added', itemId: RULER, lineId: RECORD_LINE }],
    explanation: {
      result: `Beban ${grams} g memberi gaya F = m × g = ${fmt(grams / 1000, 2)} × 9,8 = ${fmt(force, 2)} N. ${name} bertambah panjang ${fmt(dx, 4)} m, jadi k = F ÷ Δx = ${fmt(k, 0)} N/m.`,
      reason:
        'Hukum Hooke: selama masih dalam batas elastis, pertambahan panjang pegas sebanding dengan gaya tariknya. Nilai k tetap untuk satu pegas; pegas yang lebih kaku (k besar) memanjang lebih sedikit untuk beban yang sama.',
      formula: 'F = k × Δx',
    },
  })
}

function addMass(w: World, mass: string): Result {
  if (hangerLoad(w) + PIECE_MASS > MAX_LOAD) {
    return reject(
      `Beban paling besar ${MAX_LOAD} g agar pegas tetap dalam batas elastis.`,
    )
  }
  return ok(relax(w, moveTo(w, mass, HANGER), loadedSpring(w)))
}

const items: ItemDef[] = [
  ...SPRINGS.map((s) => ({
    id: s.id,
    kind: 'spring',
    name: s.name,
    state: STILL_SPRING,
  })),
  { id: HANGER, kind: 'hanger', name: 'Gantungan beban' },
  ...MASSES.map((id) => ({
    id,
    kind: 'mass',
    name: `Beban ${PIECE_MASS} g`,
  })),
  { id: RULER, kind: 'ruler', name: 'Mistar' },
]

const FRESH = Object.fromEntries(items.map((i) => [i.id, i.state ?? {}]))

export const hookeLaw: Experiment = {
  id: 'hukum-hooke',
  subject: 'fisika',
  title: 'Hukum Hooke',
  topic: 'Gerak & gaya',
  summary:
    'Gantung beban di pegas, ukur pertambahan panjangnya dengan mistar, dan tentukan konstanta pegas.',
  description:
    'Pegas ada di kasur, pulpen, dan timbangan. Makin berat beban, makin panjang pegas tertarik, tetapi seberapa panjang? Di eksperimen ini kamu menggantung pegas di statif, menambah beban 50 g satu per satu, lalu membaca pertambahan panjangnya dengan mistar.',
  previewImage: '/img/lab/hukum-hooke-bg.svg',
  objectives: [
    'Menentukan hubungan gaya dan pertambahan panjang pegas.',
    'Menghitung konstanta pegas dari gaya dan pertambahan panjang.',
  ],
  tips: [
    'Tambah beban satu per satu dan tunggu pegas diam sebelum membaca mistar.',
    'Bandingkan pertambahan panjang Pegas A dan Pegas B untuk beban yang sama.',
    'Lepas semua beban sebelum mengganti pegas.',
  ],
  concepts: [
    {
      title: 'Gaya berat',
      content:
        'Beban bermassa m ditarik bumi dengan gaya berat F = m × g, dengan m dalam kilogram dan g = 9,8 m/s². Gaya inilah yang menarik pegas.',
      formula: 'F = m × g',
    },
    {
      title: 'Hukum Hooke',
      content:
        'Selama masih dalam batas elastis, pertambahan panjang pegas (Δx) sebanding dengan gaya yang menariknya. Konstanta pegas k menunjukkan kekakuan pegas.',
      formula: 'F = k × Δx',
    },
  ],
  columns: [
    { key: 'massa', label: 'Massa beban (g)' },
    { key: 'gaya', label: 'Gaya F (N)' },
    { key: 'pertambahan', label: 'Pertambahan panjang Δx (m)' },
    { key: 'konstanta', label: 'Konstanta k (N/m)' },
  ],
  items,
  zones: [
    { id: CLAMP, name: 'Penjepit statif', accepts: ['spring'], capacity: 1 },
    { id: SIDE, name: 'Sisi pegas', accepts: ['ruler'], capacity: 1 },
  ],
  interactions: [
    {
      source: 'hanger',
      target: 'spring',
      run: (w, hanger, spring) => {
        if (w.items[spring].at !== CLAMP) {
          return reject('Gantung pegas di statif dulu.')
        }
        return ok(relax(w, moveTo(w, hanger, spring), spring))
      },
    },
    {
      source: 'hanger',
      target: SHELF,
      run: (w, hanger) => {
        let next = moveTo(w, hanger, SHELF)
        for (const mass of itemsAt(w, HANGER)) next = moveTo(next, mass, SHELF)
        return ok(relax(w, next, loadedSpring(w)))
      },
    },
    { source: 'mass', target: 'hanger', run: (w, mass) => addMass(w, mass) },
    {
      source: 'mass',
      target: 'mass',
      run: (w, mass, below) =>
        w.items[below].at === HANGER
          ? addMass(w, mass)
          : reject('Tumpuk beban di gantungan beban.'),
    },
    {
      source: 'mass',
      target: 'spring',
      run: (w, mass, spring) =>
        w.items[HANGER].at === spring
          ? addMass(w, mass)
          : reject('Pasang gantungan beban di ujung pegas dulu.'),
    },
    {
      source: 'mass',
      target: SHELF,
      run: (w, mass) => {
        const onHanger = w.items[mass].at === HANGER
        const next = moveTo(w, mass, SHELF)
        return ok(onHanger ? relax(w, next, loadedSpring(w)) : next)
      },
    },
    // A spring goes back with whatever hangs on it; the guard keeps loaded ones in place.
    {
      source: 'spring',
      target: SHELF,
      run: (w, spring) => ok(toShelf(w, spring, FRESH)),
    },
    {
      source: 'ruler',
      target: SIDE,
      run: (w, ruler) => {
        const next = moveTo(w, ruler, SIDE)
        const spring = clampedSpring(next)
        if (
          !spring ||
          bool(next, spring, 'moving') ||
          !springLoad(next, spring)
        ) {
          return ok(next)
        }
        return measure(next, spring)
      },
    },
  ],
  guard: (w, id) =>
    isSpring(id) && springLoad(w, id) > 0
      ? 'Lepas semua beban dulu sebelum mengganti pegas.'
      : null,
  tick: (w, dt) => {
    let next = w
    let result: Outcome | null = null
    for (const { id } of SPRINGS) {
      if (!bool(next, id, 'moving')) continue
      const t = num(next, id, 't') + dt
      if (t < SETTLE_SECONDS) {
        next = update(next, id, { t })
        continue
      }
      next = update(next, id, {
        t: 0,
        moving: false,
        from: num(next, id, 'target'),
      })
      if (!springLoad(next, id)) continue
      result =
        next.items[RULER].at === SIDE
          ? measure(next, id)
          : ok(next, {
              hint: 'Pegas sudah diam. Pasang mistar di sisi pegas untuk membaca pertambahan panjangnya.',
            })
    }
    return result ? { ...result, world: next } : ok(next)
  },
  view: (w) => {
    const view: Record<string, ItemView> = {}
    for (const s of SPRINGS) {
      const x = currentExtension(w, s.id)
      view[s.id] = {
        label: s.name,
        extension: round(x, 4),
        length: round(NATURAL_LENGTH + x, 4),
      }
    }
    view[HANGER] = { label: `Gantungan · ${hangerLoad(w)} g` }
    const spring = clampedSpring(w)
    if (w.items[RULER].at === SIDE && spring) {
      const x = currentExtension(w, spring)
      view[RULER] = {
        // The spring's length (m), for the marker on the ruler.
        length: round(NATURAL_LENGTH + x, 4),
        // Shown beside the ruler, where it covers neither spring nor poster.
        label: `Panjang ${fmt((NATURAL_LENGTH + x) * 100, 2)} cm · Δx ${fmt(x * 100, 2)} cm`,
      }
    } else {
      view[RULER] = { label: '– cm' }
    }
    return view
  },
  prediction: {
    question:
      'Kalau bebannya dijadikan dua kali lipat, pertambahan panjang pegas jadi bagaimana?',
    options: ['Dua kali lebih panjang', 'Sama saja', 'Setengahnya'],
  },
  lines: [
    {
      id: RECORD_LINE,
      text: 'Pertambahan panjang pegas terbaca di mistar dan tercatat. Tambah beban lagi atau ganti pegas, lalu bandingkan nilai k-nya.',
    },
  ],
}
