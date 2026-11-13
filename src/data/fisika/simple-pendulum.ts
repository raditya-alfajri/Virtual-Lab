import { SHELF } from '../../lib/engine'
import type {
  Experiment,
  GuideStep,
  ItemDef,
  ItemView,
  Result,
  Row,
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

// Values from PRD section 7 (F2).
export const GRAVITY = 9.8 // m/s²
export const MAX_ANGLE = 15 // degrees, the small-swing limit
export const SWINGS = 10 // swings the stopwatch counts

// F2 formula: the period does not depend on the bob's mass.
export const period = (length: number, g = GRAVITY) =>
  2 * Math.PI * Math.sqrt(length / g)

/** The bob's angle t seconds after it is let go from `amplitude` degrees. */
export const angleAt = (amplitude: number, length: number, t: number) =>
  amplitude * Math.cos((2 * Math.PI * t) / period(length))

const CLAMP = 'clamp'
const STAND = 'stand'
const STOPWATCH = 'stopwatch'

const RECORD_LINE = 'f2-recorded'

const STRINGS = [20, 40, 60, 80, 100].map((cm) => ({
  id: `string-${cm}`,
  cm,
  length: cm / 100,
}))
const BOBS = [50, 100, 200].map((mass) => ({ id: `bob-${mass}`, mass }))

const lengthOf = (string: string) =>
  STRINGS.find((s) => s.id === string)!.length
const massOf = (bob: string) => BOBS.find((b) => b.id === bob)!.mass
const isString = (id: string) => STRINGS.some((s) => s.id === id)
const isBob = (id: string) => BOBS.some((b) => b.id === id)

const STILL_BOB = { angle: 0, swinging: false, phase: 0 }
const IDLE_STOPWATCH = { counting: false, elapsed: 0, swings: 0 }

const clampedString = (world: World) => itemsAt(world, CLAMP).find(isString)
const bobOn = (world: World, string: string) =>
  itemsAt(world, string).find(isBob)

/** The bob hanging from the string on the stand, with that string. */
function hangingBob(world: World): { bob: string; string: string } | null {
  const string = clampedString(world)
  const bob = string && bobOn(world, string)
  return string && bob ? { bob, string } : null
}

function swinging(world: World) {
  const hang = hangingBob(world)
  return hang && bool(world, hang.bob, 'swinging') ? hang : null
}

const stopCounting = (world: World) =>
  bool(world, STOPWATCH, 'counting')
    ? update(world, STOPWATCH, IDLE_STOPWATCH)
    : world

function startCounting(world: World): Result {
  if (!swinging(world)) {
    return reject('Lepas bandul dulu agar ada ayunan yang dihitung.')
  }
  return ok(update(world, STOPWATCH, { ...IDLE_STOPWATCH, counting: true }))
}

function pullBob(world: World, bob: string, value: number): Result {
  if (hangingBob(world)?.bob !== bob) {
    return reject('Gantung tali di statif dan pasang bandul di ujungnya dulu.')
  }
  if (Math.abs(value) > MAX_ANGLE) {
    return reject(
      `Simpangan paling besar ${MAX_ANGLE}°. Rumus T = 2π√(L ÷ g) hanya berlaku untuk simpangan kecil.`,
    )
  }
  // The sign is kept: negative to the left, positive to the right.
  return ok(update(stopCounting(world), bob, { ...STILL_BOB, angle: value }))
}

function releaseBob(world: World, bob: string): Result {
  if (bool(world, bob, 'swinging')) return ok(world)
  if (hangingBob(world)?.bob !== bob || num(world, bob, 'angle') === 0) {
    return reject('Tarik bandul ke samping dulu agar bisa berayun.')
  }
  return ok(update(world, bob, { swinging: true, phase: 0 }))
}

function stopBob(world: World, bob: string): Result {
  return bool(world, bob, 'swinging')
    ? ok(update(stopCounting(world), bob, STILL_BOB))
    : reject('Tarik bandul ke samping, lalu lepaskan agar berayun.')
}

function guide(world: World, rows: Row[]): GuideStep | null {
  const string = clampedString(world)
  if (!string) {
    return {
      text: 'Gantung satu tali di penjepit statif.',
      target: 'string-40',
    }
  }
  const bob = bobOn(world, string)
  if (!bob) {
    const spare = BOBS.find((b) => !isString(world.items[b.id].at))
    return { text: 'Pasang bandul di ujung tali.', target: spare?.id }
  }
  if (world.items[STOPWATCH].at !== STAND) {
    return { text: 'Seret stopwatch ke statif.', target: STOPWATCH }
  }
  const recorded = rows.some(
    (row) => row.panjang === lengthOf(string) && row.massa === massOf(bob),
  )
  if (!bool(world, bob, 'swinging')) {
    return recorded
      ? {
          text: 'Sudah tercatat. Ganti tali atau bandulnya, lalu ayunkan lagi.',
          target: string,
        }
      : {
          text: 'Tarik bandul ke samping, paling jauh 15°, lalu lepaskan.',
          target: bob,
        }
  }
  if (bool(world, STOPWATCH, 'counting')) {
    return { text: 'Tunggu sampai 10 ayunan selesai dihitung.' }
  }
  if (recorded) {
    return {
      text: 'Tercatat! Ketuk bandul untuk menghentikannya, lalu ganti tali atau bandul.',
      target: bob,
    }
  }
  return num(world, STOPWATCH, 'elapsed') > 0
    ? {
        text: 'Ketuk stopwatch untuk menge-nol-kan, lalu ketuk lagi untuk mulai.',
        target: STOPWATCH,
      }
    : {
        text: 'Ketuk stopwatch untuk menghitung 10 ayunan.',
        target: STOPWATCH,
      }
}

const REASON =
  'Periode ayunan hanya bergantung pada panjang tali dan percepatan gravitasi, tidak pada massa bandul. Tali 4 kali lebih panjang membuat periode 2 kali lebih lama, sehingga T² sebanding dengan L.'

const items: ItemDef[] = [
  ...STRINGS.map((s) => ({
    id: s.id,
    kind: 'string',
    name: `Tali ${s.cm} cm`,
  })),
  ...BOBS.map((b) => ({
    id: b.id,
    kind: 'bob',
    name: `Bandul ${b.mass} g`,
    state: STILL_BOB,
  })),
  { id: 'protractor', kind: 'protractor', name: 'Busur derajat' },
  {
    id: STOPWATCH,
    kind: 'stopwatch',
    name: 'Stopwatch',
    state: IDLE_STOPWATCH,
  },
]

const FRESH = Object.fromEntries(items.map((i) => [i.id, i.state ?? {}]))
const forBobs = <T>(handler: T) =>
  Object.fromEntries(BOBS.map((b) => [b.id, handler]))

export const simplePendulum: Experiment = {
  id: 'ayunan-sederhana',
  subject: 'fisika',
  title: 'Ayunan Sederhana',
  topic: 'Getaran',
  summary:
    'Ayunkan bandul dengan panjang tali dan massa berbeda, lalu ukur periodenya dengan stopwatch.',
  description:
    'Ayunan di taman bermain bergerak bolak-balik dengan irama yang tetap. Apa yang menentukan irama itu: panjang tali atau berat bandulnya? Di eksperimen ini kamu menggantung tali dan bandul di statif, menarik bandul ke samping, melepasnya, lalu menghitung waktu 10 ayunan.',
  previewImage: '/img/lab/ayunan-sederhana-bg.svg',
  objectives: [
    'Menyelidiki pengaruh panjang tali terhadap periode ayunan.',
    'Membuktikan bahwa massa bandul tidak memengaruhi periode.',
  ],
  tips: [
    'Tarik bandul dengan simpangan kecil, paling besar 15°.',
    'Mengukur 10 ayunan lalu membaginya dengan 10 lebih teliti daripada mengukur satu ayunan.',
    'Ganti tali dengan bandul yang sama, lalu ganti bandul dengan tali yang sama, dan bandingkan periodenya.',
  ],

  items,
  zones: [
    { id: CLAMP, name: 'Penjepit statif', accepts: ['string'], capacity: 1 },
    { id: STAND, name: 'Statif', accepts: ['protractor', 'stopwatch'] },
  ],
  interactions: [
    {
      source: 'bob',
      target: 'string',
      run: (world, bob, string) => {
        if (bobOn(world, string)) {
          return reject('Ujung tali ini sudah ada bandulnya.')
        }
        const next = update(moveTo(world, bob, string), bob, STILL_BOB)
        return world.items[string].at === CLAMP
          ? ok(next, {
              hint: 'Seret bandul ke samping (paling besar 15°), lalu lepaskan agar berayun.',
            })
          : ok(next)
      },
    },
    {
      source: 'stopwatch',
      target: STAND,
      run: (world, id) => {
        const placed = update(moveTo(world, id, STAND), id, IDLE_STOPWATCH)
        if (swinging(placed)) return startCounting(placed)
        return ok(placed, {
          hint: 'Stopwatch siap. Lepas bandul, lalu tap stopwatch untuk menghitung 10 ayunan.',
        })
      },
    },
    // Back on the shelf, items start fresh; a string takes its bob along.
    ...['string', 'bob', 'stopwatch'].map((source) => ({
      source,
      target: SHELF,
      run: (world: World, id: string) => ok(toShelf(world, id, FRESH)),
    })),
  ],
  pull: forBobs(pullBob),
  release: forBobs(releaseBob),
  use: {
    ...forBobs(stopBob),
    [STOPWATCH]: (world, id) => {
      if (world.items[id].at !== STAND) {
        return reject('Seret stopwatch ke statif dulu.')
      }
      if (bool(world, id, 'counting')) {
        return ok(update(world, id, { counting: false }))
      }
      if (num(world, id, 'elapsed') > 0) {
        return ok(update(world, id, IDLE_STOPWATCH))
      }
      return startCounting(world)
    },
  },
  guard: (world, id, target) => {
    const hang = swinging(world)
    if (!hang) return null
    const busy = [hang.bob, hang.string, CLAMP]
    return busy.includes(id) || busy.includes(target)
      ? 'Hentikan bandul dulu sebelum mengganti tali atau bandul.'
      : null
  },
  tick: (world, dt) => {
    const hang = swinging(world)
    if (!hang) return ok(world)
    const { bob, string } = hang
    let next = update(world, bob, { phase: num(world, bob, 'phase') + dt })
    if (!bool(next, STOPWATCH, 'counting')) return ok(next)

    const length = lengthOf(string)
    const T = period(length)
    const total = SWINGS * T
    const elapsed = Math.min(num(next, STOPWATCH, 'elapsed') + dt, total)
    const done = elapsed >= total
    next = update(next, STOPWATCH, {
      elapsed,
      swings: done ? SWINGS : Math.floor(elapsed / T),
      counting: !done,
    })
    if (!done) return ok(next)

    const mass = massOf(bob)
    return ok(next, {
      record: {
        panjang: length,
        massa: mass,
        waktu: round(total, 2),
        periode: round(T, 2),
        periodeKuadrat: round(T * T, 2),
      },
      events: [
        { type: 'record-added', itemId: STOPWATCH, lineId: RECORD_LINE },
      ],
      explanation: {
        result: `Dengan tali ${fmt(length, 1)} m dan bandul ${mass} g, 10 ayunan butuh ${fmt(total, 2)} s. Jadi periode T = ${fmt(total, 2)} ÷ 10 = ${fmt(T, 2)} s.`,
        reason: REASON,
        formula: 'T = 2π × √(L ÷ g)',
      },
    })
  },
  view: (world) => {
    const view: Record<string, ItemView> = {}
    for (const s of STRINGS) view[s.id] = { label: `${s.cm} cm` }
    const hang = hangingBob(world)
    let current = 0
    for (const b of BOBS) {
      const string = world.items[b.id].at
      const amplitude = num(world, b.id, 'angle')
      const angle =
        bool(world, b.id, 'swinging') && isString(string)
          ? angleAt(amplitude, lengthOf(string), num(world, b.id, 'phase'))
          : amplitude
      if (hang?.bob === b.id) current = angle
      view[b.id] = {
        label: `Bandul ${b.mass} g`,
        angle: round(angle, 2),
        action: bool(world, b.id, 'swinging') ? 'Hentikan' : undefined,
      }
    }
    // A label beside the protractor, clear of the swinging string.
    view.protractor = { label: `${fmt(Math.abs(current), 0)}°` }
    const counting = bool(world, STOPWATCH, 'counting')
    const elapsed = num(world, STOPWATCH, 'elapsed')
    view[STOPWATCH] = {
      reading: `${fmt(elapsed, 2)} s`,
      label: `${num(world, STOPWATCH, 'swings')}/${SWINGS} ayunan`,
      active: counting,
      action: counting ? 'Berhenti' : elapsed > 0 ? 'Nol-kan' : 'Mulai',
    }
    return view
  },
  guide,

  columns: [
    { key: 'panjang', label: 'Panjang tali L (m)' },
    { key: 'massa', label: 'Massa bandul (g)' },
    { key: 'waktu', label: 'Waktu 10 ayunan (s)' },
    { key: 'periode', label: 'Periode T (s)' },
    { key: 'periodeKuadrat', label: 'T² (s²)' },
  ],
  prediction: {
    question:
      'Kalau bandulnya diganti dengan yang lebih berat, periode ayunannya jadi bagaimana?',
    options: ['Lebih lama', 'Lebih singkat', 'Tidak berubah'],
  },
  lines: [
    {
      id: RECORD_LINE,
      text: '10 ayunan selesai dihitung dan periodenya tercatat. Coba ganti panjang tali atau massa bandul, lalu bandingkan periodenya.',
    },
  ],
  concepts: [
    {
      title: 'Periode ayunan',
      content:
        'Periode (T) adalah waktu untuk satu ayunan penuh, yaitu bergerak dari satu sisi ke sisi lain lalu kembali. Periode diukur dari waktu beberapa ayunan dibagi jumlah ayunannya.',
      formula: 'T = t ÷ n',
    },
    {
      title: 'Rumus ayunan sederhana',
      content:
        'Untuk simpangan kecil (≤ 15°), periode bergantung pada panjang tali L dan percepatan gravitasi g = 9,8 m/s², tetapi tidak pada massa bandul.',
      formula: 'T = 2π × √(L ÷ g)',
    },
  ],
}
