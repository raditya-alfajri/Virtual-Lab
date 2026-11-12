import { SHELF } from '../../lib/engine'
import type { Experiment, ItemDef, ItemView, Result, World } from '../types'
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

// Values from PRD section 7 (F1). Friction is ignored.
export const CART_MASS = 0.5 // kg
export const MAX_TOTAL_MASS = 3 // kg, cart and weights
export const SENSOR_DISTANCE = 1 // m
export const SPEED_TIME = 2 // s, the speed is recorded 2 s after release
/** Not in the PRD; only used to animate the cart after it passes the sensor. */
export const TRACK_LENGTH = 1.5 // m

// F1 formulas.
export const acceleration = (force: number, mass: number) => force / mass
export const travelTime = (distance: number, a: number) =>
  Math.sqrt((2 * distance) / a)
export const accelerationFromTime = (distance: number, t: number) =>
  (2 * distance) / (t * t)
export const speedAfter = (a: number, t: number) => a * t
export const distanceAfter = (a: number, t: number) => 0.5 * a * t * t

const CART = 'cart'
const SENSOR = 'sensor'
const START = 'start'
const TRACK = 'track'
const SENSOR_ZONE = 'sensor-1m'

const RECORD_LINE = 'f1-recorded'

const WEIGHTS = [
  { id: 'weight-500-1', mass: 0.5 },
  { id: 'weight-500-2', mass: 0.5 },
  { id: 'weight-1000-1', mass: 1 },
  { id: 'weight-1000-2', mass: 1 },
]
const FANS = [2, 4, 6, 8, 10].map((force) => ({ id: `fan-${force}`, force }))

const weightMass = (id: string) => WEIGHTS.find((x) => x.id === id)!.mass
const fanForce = (id: string) => FANS.find((f) => f.id === id)!.force
const isWeight = (id: string) => WEIGHTS.some((x) => x.id === id)
const isFan = (id: string) => FANS.some((f) => f.id === id)

const fanOnCart = (world: World) => itemsAt(world, CART).find(isFan)

export function totalMass(world: World): number {
  const load = itemsAt(world, CART)
    .filter(isWeight)
    .reduce((sum, id) => sum + weightMass(id), 0)
  return round(CART_MASS + load, 2)
}

export function cartForce(world: World): number {
  const fan = fanOnCart(world)
  return fan ? fanForce(fan) : 0
}

const STILL_CART = {
  running: false,
  elapsed: 0,
  position: 0,
  crossed: false,
  force: 0,
  mass: 0,
}
const IDLE_SENSOR = { time: 0 }

const REASON =
  'Hukum II Newton: percepatan sebanding dengan gaya dan berbanding terbalik dengan massa. Gaya lebih besar membuat kecepatan troli bertambah lebih cepat; massa lebih besar membuatnya bertambah lebih lambat.'

function addWeight(world: World, weight: string): Result {
  const mass = round(totalMass(world) + weightMass(weight), 2)
  if (mass > MAX_TOTAL_MASS) {
    return reject(
      `Total massa troli dan beban paling besar ${MAX_TOTAL_MASS} kg. Sekarang sudah ${fmt(totalMass(world), 1)} kg.`,
    )
  }
  return ok(moveTo(world, weight, CART))
}

function launch(world: World): Result {
  const at = world.items[CART].at
  if (at === TRACK) {
    return reject(
      bool(world, CART, 'running')
        ? 'Troli sedang melaju.'
        : 'Seret troli kembali ke titik start untuk mengulang.',
    )
  }
  if (at !== START) return reject('Taruh troli di titik start dulu.')
  const force = cartForce(world)
  if (force === 0) {
    return reject(
      'Troli tidak bergerak tanpa gaya. Pasang kipas di belakang troli dulu.',
    )
  }
  return ok(
    update(moveTo(world, CART, TRACK), CART, {
      ...STILL_CART,
      running: true,
      force,
      mass: totalMass(world),
    }),
  )
}

const items: ItemDef[] = [
  { id: CART, kind: 'cart', name: 'Troli', state: STILL_CART },
  ...WEIGHTS.map((x) => ({
    id: x.id,
    kind: 'weight',
    name: `Beban ${fmt(x.mass, x.mass % 1 ? 1 : 0)} kg`,
  })),
  ...FANS.map((f) => ({ id: f.id, kind: 'fan', name: `Kipas ${f.force} N` })),
  { id: SENSOR, kind: 'sensor', name: 'Sensor gerak', state: IDLE_SENSOR },
]

const FRESH = Object.fromEntries(items.map((i) => [i.id, i.state ?? {}]))

export const newtonLaw: Experiment = {
  id: 'hukum-newton',
  subject: 'fisika',
  title: 'Hukum Newton',
  topic: 'Gerak & gaya',
  summary:
    'Dorong troli dengan kipas, ukur waktu tempuhnya, dan temukan hubungan gaya, massa, dan percepatan.',
  description:
    'Kenapa mobil kosong lebih mudah didorong daripada mobil penuh penumpang? Di eksperimen ini kamu memasang kipas pendorong dan beban di troli, melepasnya di lintasan datar, lalu memakai sensor gerak untuk mengukur waktu tempuh 1 meter.',
  previewImage: '/img/lab/hukum-newton-bg.svg',
  objectives: [
    'Menemukan hubungan gaya, massa, dan percepatan (a = F ÷ m).',
    'Menghitung percepatan dari jarak dan waktu tempuh yang diukur sensor.',
  ],
  tips: [
    'Ubah satu variabel saja dalam satu kali percobaan: gaya kipas atau massa beban.',
    'Pasang sensor di titik 1 m sebelum melepas troli agar waktunya tercatat.',
    'Bandingkan percepatan saat gaya dijadikan dua kali lipat, lalu saat massa dijadikan dua kali lipat.',
  ],

  items,
  zones: [
    { id: START, name: 'Titik start', accepts: ['cart'], capacity: 1 },
    { id: TRACK, name: 'Lintasan', accepts: [] },
    { id: SENSOR_ZONE, name: 'Titik 1 m', accepts: ['sensor'], capacity: 1 },
  ],
  interactions: [
    {
      source: 'weight',
      target: CART,
      run: (world, weight) => addWeight(world, weight),
    },
    {
      source: 'weight',
      target: 'weight',
      run: (world, weight, below) =>
        world.items[below].at === CART
          ? addWeight(world, weight)
          : reject('Tumpuk beban di atas troli.'),
    },
    {
      source: 'fan',
      target: CART,
      run: (world, fan) =>
        fanOnCart(world)
          ? reject(
              'Troli hanya boleh memakai satu kipas. Kembalikan kipas yang terpasang ke rak dulu.',
            )
          : ok(moveTo(world, fan, CART)),
    },
    {
      source: CART,
      target: START,
      run: (world) => ok(update(moveTo(world, CART, START), CART, STILL_CART)),
    },
    {
      source: CART,
      target: TRACK,
      run: () =>
        reject('Taruh troli di titik start, lalu tap troli untuk melepasnya.'),
    },
    // The cart takes its fan and weights back to the shelf with it.
    {
      source: CART,
      target: SHELF,
      run: (world) => ok(toShelf(world, CART, FRESH)),
    },
  ],
  use: { [CART]: launch },
  release: { [CART]: launch },
  guard: (world) =>
    bool(world, CART, 'running')
      ? 'Troli sedang melaju. Tunggu sampai berhenti di ujung lintasan.'
      : null,
  tick: (world, dt) => {
    if (!bool(world, CART, 'running')) return ok(world)
    const force = num(world, CART, 'force')
    const mass = num(world, CART, 'mass')
    const a = acceleration(force, mass)
    const end = travelTime(TRACK_LENGTH, a)
    const elapsed = Math.min(num(world, CART, 'elapsed') + dt, end)
    const position = Math.min(distanceAfter(a, elapsed), TRACK_LENGTH)
    const crossing =
      !bool(world, CART, 'crossed') && position >= SENSOR_DISTANCE

    let next = update(world, CART, {
      elapsed,
      position,
      crossed: bool(world, CART, 'crossed') || crossing,
      running: elapsed < end,
    })
    if (!crossing) return ok(next)

    if (world.items[SENSOR].at !== SENSOR_ZONE) {
      return ok(next, {
        hint: 'Sensor belum dipasang di titik 1 m, jadi waktu tempuh tidak tercatat.',
      })
    }
    // The exact time the cart passes 1 m, whatever the size of dt.
    const t = travelTime(SENSOR_DISTANCE, a)
    const measured = accelerationFromTime(SENSOR_DISTANCE, t)
    next = update(next, SENSOR, { time: t })
    return ok(next, {
      record: {
        gaya: force,
        massa: mass,
        waktu: round(t, 2),
        percepatan: round(measured, 2),
        kecepatan: round(speedAfter(measured, SPEED_TIME), 2),
      },
      events: [{ type: 'record-added', itemId: SENSOR, lineId: RECORD_LINE }],
      explanation: {
        result: `Gaya ${fmt(force, 0)} N mendorong massa ${fmt(mass, 1)} kg. Sensor mencatat waktu tempuh 1 m = ${fmt(t, 2)} s, jadi a = 2s ÷ t² = ${fmt(measured, 2)} m/s², sama dengan F ÷ m = ${fmt(force, 0)} ÷ ${fmt(mass, 1)}.`,
        reason: REASON,
        formula: 'a = F ÷ m · a = 2s ÷ t²',
      },
    })
  },
  view: (world) => {
    const position = num(world, CART, 'position')
    const running = bool(world, CART, 'running')
    const time = num(world, SENSOR, 'time')
    const force = cartForce(world)
    const view: Record<string, ItemView> = {
      [CART]: {
        label: `Troli · ${fmt(totalMass(world), 1)} kg${force ? ` · ${force} N` : ''}`,
        position,
        progress: position / TRACK_LENGTH,
        action: world.items[CART].at === START ? 'Lepas' : undefined,
        moving: running,
      },
      [SENSOR]: {
        reading: time > 0 ? `${fmt(time, 2)} s` : '– s',
        active: time > 0,
      },
    }
    // The fan on the cart spins while the cart moves.
    for (const f of FANS) {
      view[f.id] = { active: running && world.items[f.id].at === CART }
    }
    return view
  },

  columns: [
    { key: 'gaya', label: 'Gaya F (N)' },
    { key: 'massa', label: 'Massa m (kg)' },
    { key: 'waktu', label: 'Waktu tempuh 1 m (s)' },
    { key: 'percepatan', label: 'Percepatan a (m/s²)' },
    { key: 'kecepatan', label: 'Kecepatan setelah 2 s (m/s)' },
  ],
  prediction: {
    question:
      'Kalau gaya kipas dijadikan dua kali lipat, percepatan troli jadi bagaimana?',
    options: ['Dua kali lebih besar', 'Setengahnya', 'Tidak berubah'],
  },
  lines: [
    {
      id: RECORD_LINE,
      text: 'Sensor mencatat waktu tempuhnya! Dari jarak 1 m dan waktu itu, percepatan troli bisa dihitung. Coba ubah gaya kipas atau tambah beban, lalu bandingkan.',
    },
  ],
  concepts: [
    {
      title: 'Hukum I Newton',
      content:
        'Benda diam tetap diam dan benda bergerak tetap bergerak lurus beraturan jika tidak ada gaya total yang bekerja. Karena itu troli tidak bergerak tanpa kipas.',
    },
    {
      title: 'Hukum II Newton',
      content:
        'Percepatan benda sebanding dengan gaya total dan berbanding terbalik dengan massanya.',
      formula: 'a = F ÷ m',
    },
    {
      title: 'Mengukur percepatan',
      content:
        'Troli mulai dari diam dan dipercepat tetap, sehingga jarak s = ½ × a × t². Dari jarak 1 m dan waktu tempuh t, percepatan dapat dihitung. Kecepatan setelah t detik adalah v = a × t.',
      formula: 'a = 2s ÷ t² · v = a × t',
    },
  ],
}
