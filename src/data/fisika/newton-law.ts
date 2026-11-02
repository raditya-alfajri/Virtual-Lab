import type { Experiment, ItemDef, Result, World } from '../types'
import {
  bool,
  fmt,
  itemsAt,
  moveTo,
  num,
  ok,
  reject,
  round,
  update,
} from '../instruments'

// Nilai dari PRD bagian 7 (F1). Gesekan diabaikan.
export const CART_MASS = 0.5 // kg
export const MAX_TOTAL_MASS = 3 // kg, troli + beban
export const SENSOR_DISTANCE = 1 // m
export const SPEED_TIME = 2 // s, kecepatan dicatat setelah 2 detik
// Panjang lintasan tidak ada di PRD; hanya untuk animasi troli setelah melewati sensor.
export const TRACK_LENGTH = 1.5 // m

// Rumus F1.
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

const fanOnCart = (w: World) => itemsAt(w, CART).find(isFan)

export function totalMass(w: World): number {
  const load = itemsAt(w, CART)
    .filter(isWeight)
    .reduce((sum, id) => sum + weightMass(id), 0)
  return round(CART_MASS + load, 2)
}

export function cartForce(w: World): number {
  const fan = fanOnCart(w)
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

const REASON =
  'Hukum II Newton: percepatan sebanding dengan gaya dan berbanding terbalik dengan massa. Gaya lebih besar membuat kecepatan troli bertambah lebih cepat; massa lebih besar membuatnya bertambah lebih lambat.'

function addWeight(w: World, weight: string): Result {
  const mass = round(totalMass(w) + weightMass(weight), 2)
  if (mass > MAX_TOTAL_MASS) {
    return reject(
      `Total massa troli dan beban paling besar ${MAX_TOTAL_MASS} kg. Sekarang sudah ${fmt(totalMass(w), 1)} kg.`,
    )
  }
  return ok(moveTo(w, weight, CART))
}

function launch(w: World): Result {
  const at = w.items[CART].at
  if (at === TRACK) {
    return reject(
      bool(w, CART, 'running')
        ? 'Troli sedang melaju.'
        : 'Seret troli kembali ke titik start untuk mengulang.',
    )
  }
  if (at !== START) return reject('Taruh troli di titik start dulu.')
  const force = cartForce(w)
  if (force === 0) {
    return reject(
      'Troli tidak bergerak tanpa gaya. Pasang kipas di belakang troli dulu.',
    )
  }
  const next = update(moveTo(w, CART, TRACK), CART, {
    ...STILL_CART,
    running: true,
    force,
    mass: totalMass(w),
  })
  return ok(next)
}

const items: ItemDef[] = [
  {
    id: CART,
    kind: 'cart',
    name: 'Troli',
    props: { mass: CART_MASS },
    state: STILL_CART,
  },
  ...WEIGHTS.map((x) => ({
    id: x.id,
    kind: 'weight',
    name: `Beban ${fmt(x.mass, x.mass % 1 ? 1 : 0)} kg`,
    props: { mass: x.mass },
  })),
  ...FANS.map((f) => ({
    id: f.id,
    kind: 'fan',
    name: `Kipas ${f.force} N`,
    props: { force: f.force },
  })),
  { id: SENSOR, kind: 'sensor', name: 'Sensor gerak', state: { time: 0 } },
]

export const newtonLaw: Experiment = {
  id: 'hukum-newton',
  title: 'Hukum Newton',
  subject: 'fisika',
  topic: 'Gerak & gaya',
  summary:
    'Dorong troli dengan kipas, ukur waktu tempuhnya, dan temukan hubungan gaya, massa, dan percepatan.',
  description:
    'Kenapa mobil kosong lebih mudah didorong daripada mobil penuh penumpang? Di eksperimen ini kamu memasang kipas pendorong dan beban di troli, melepasnya di lintasan datar, lalu memakai sensor gerak untuk mengukur waktu tempuh 1 meter.',
  previewImage: '/img/hukum-newton.webp',
  objectives: [
    'Menemukan hubungan gaya, massa, dan percepatan (a = F ÷ m).',
    'Menghitung percepatan dari jarak dan waktu tempuh yang diukur sensor.',
  ],
  tips: [
    'Ubah satu variabel saja dalam satu kali percobaan: gaya kipas atau massa beban.',
    'Pasang sensor di titik 1 m sebelum melepas troli agar waktunya tercatat.',
    'Bandingkan percepatan saat gaya dijadikan dua kali lipat, lalu saat massa dijadikan dua kali lipat.',
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
  observationColumns: [
    { key: 'gaya', label: 'Gaya F (N)' },
    { key: 'massa', label: 'Massa m (kg)' },
    { key: 'waktu', label: 'Waktu tempuh 1 m (s)' },
    { key: 'percepatan', label: 'Percepatan a (m/s²)' },
    { key: 'kecepatan', label: 'Kecepatan setelah 2 s (m/s)' },
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
      target: 'cart',
      run: (w, weight) => addWeight(w, weight),
    },
    {
      source: 'weight',
      target: 'weight',
      run: (w, weight, below) =>
        w.items[below].at === CART
          ? addWeight(w, weight)
          : reject('Tumpuk beban di atas troli.'),
    },
    {
      source: 'fan',
      target: 'cart',
      run: (w, fan) =>
        fanOnCart(w)
          ? reject(
              'Troli hanya boleh memakai satu kipas. Kembalikan kipas yang terpasang ke rak dulu.',
            )
          : ok(moveTo(w, fan, CART)),
    },
    {
      source: 'cart',
      target: START,
      run: (w) => ok(update(moveTo(w, CART, START), CART, STILL_CART)),
    },
    {
      source: 'cart',
      target: TRACK,
      run: () =>
        reject('Taruh troli di titik start, lalu tap troli untuk melepasnya.'),
    },
  ],
  use: { cart: launch },
  release: { cart: launch },
  guard: (w) =>
    bool(w, CART, 'running')
      ? 'Troli sedang melaju. Tunggu sampai berhenti di ujung lintasan.'
      : null,
  tick: (w, dt) => {
    if (!bool(w, CART, 'running')) return ok(w)
    const force = num(w, CART, 'force')
    const mass = num(w, CART, 'mass')
    const a = acceleration(force, mass)
    const end = travelTime(TRACK_LENGTH, a)
    const elapsed = Math.min(num(w, CART, 'elapsed') + dt, end)
    const position = Math.min(distanceAfter(a, elapsed), TRACK_LENGTH)
    const crossing = !bool(w, CART, 'crossed') && position >= SENSOR_DISTANCE

    let next = update(w, CART, {
      elapsed,
      position,
      crossed: bool(w, CART, 'crossed') || crossing,
      running: elapsed < end,
    })
    if (!crossing) return ok(next)

    if (w.items[SENSOR].at !== SENSOR_ZONE) {
      return ok(next, {
        hint: 'Sensor belum dipasang di titik 1 m, jadi waktu tempuh tidak tercatat.',
      })
    }
    // Waktu tepat saat troli melewati 1 m, tidak bergantung pada besar dt.
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
      explanation: {
        result: `Gaya ${fmt(force, 0)} N mendorong massa ${fmt(mass, 1)} kg. Sensor mencatat waktu tempuh 1 m = ${fmt(t, 2)} s, jadi a = 2s ÷ t² = ${fmt(measured, 2)} m/s², sama dengan F ÷ m = ${fmt(force, 0)} ÷ ${fmt(mass, 1)}.`,
        reason: REASON,
        formula: 'a = F ÷ m · a = 2s ÷ t²',
      },
    })
  },
  isActive: (w) => bool(w, CART, 'running'),
  view: (w) => {
    const position = num(w, CART, 'position')
    const running = bool(w, CART, 'running')
    const a = running
      ? acceleration(num(w, CART, 'force'), num(w, CART, 'mass'))
      : 0
    const speed = running ? speedAfter(a, num(w, CART, 'elapsed')) : 0
    const time = num(w, SENSOR, 'time')
    const force = cartForce(w)
    return {
      [CART]: {
        label: `Troli · ${fmt(totalMass(w), 1)} kg${force ? ` · ${force} N` : ''}`,
        position,
        progress: position / TRACK_LENGTH,
        reading: `v = ${fmt(speed, 2)} m/s`,
        action: w.items[CART].at === START ? 'Lepas' : '',
      },
      [SENSOR]: { reading: time > 0 ? `${fmt(time, 2)} s` : '– s' },
    }
  },
}
