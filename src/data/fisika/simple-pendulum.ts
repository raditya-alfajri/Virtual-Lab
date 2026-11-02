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

// Nilai dari PRD bagian 7 (F2).
export const GRAVITY = 9.8 // m/s²
export const MAX_ANGLE = 15 // derajat, batas simpangan kecil
export const SWINGS = 10 // jumlah ayunan yang dihitung stopwatch

// Rumus F2: periode tidak bergantung pada massa bandul.
export const period = (length: number, g = GRAVITY) =>
  2 * Math.PI * Math.sqrt(length / g)

// Sudut bandul t detik setelah dilepas dari simpangan amplitude (derajat).
export const angleAt = (amplitude: number, length: number, t: number) =>
  amplitude * Math.cos((2 * Math.PI * t) / period(length))

const CLAMP = 'clamp'
const STAND = 'stand'
const STOPWATCH = 'stopwatch'

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

const clampedString = (w: World) => itemsAt(w, CLAMP).find(isString)
const bobOn = (w: World, string: string) => itemsAt(w, string).find(isBob)

// Bandul yang tergantung di tali pada statif, beserta panjang talinya.
function hangingBob(w: World): { bob: string; string: string } | null {
  const string = clampedString(w)
  const bob = string && bobOn(w, string)
  return string && bob ? { bob, string } : null
}

function swinging(w: World) {
  const hang = hangingBob(w)
  return hang && bool(w, hang.bob, 'swinging') ? hang : null
}

const stopCounting = (w: World) =>
  bool(w, STOPWATCH, 'counting') ? update(w, STOPWATCH, IDLE_STOPWATCH) : w

function startCounting(w: World): Result {
  if (!swinging(w)) {
    return reject('Lepas bandul dulu agar ada ayunan yang dihitung.')
  }
  return ok(update(w, STOPWATCH, { ...IDLE_STOPWATCH, counting: true }))
}

const REASON =
  'Periode ayunan hanya bergantung pada panjang tali dan percepatan gravitasi, tidak pada massa bandul. Tali 4 kali lebih panjang membuat periode 2 kali lebih lama, sehingga T² sebanding dengan L.'

const items: ItemDef[] = [
  ...STRINGS.map((s) => ({
    id: s.id,
    kind: 'string',
    name: `Tali ${s.cm} cm`,
    props: { length: s.length },
  })),
  ...BOBS.map((b) => ({
    id: b.id,
    kind: 'bob',
    name: `Bandul ${b.mass} g`,
    props: { mass: b.mass },
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

export const simplePendulum: Experiment = {
  id: 'ayunan-sederhana',
  title: 'Ayunan Sederhana',
  subject: 'fisika',
  topic: 'Getaran',
  summary:
    'Ayunkan bandul dengan panjang tali dan massa berbeda, lalu ukur periodenya dengan stopwatch.',
  description:
    'Ayunan di taman bermain bergerak bolak-balik dengan irama yang tetap. Apa yang menentukan irama itu: panjang tali atau berat bandulnya? Di eksperimen ini kamu menggantung tali dan bandul di statif, menarik bandul ke samping, melepasnya, lalu menghitung waktu 10 ayunan.',
  previewImage: '/img/ayunan-sederhana.webp',
  objectives: [
    'Menyelidiki pengaruh panjang tali terhadap periode ayunan.',
    'Membuktikan bahwa massa bandul tidak memengaruhi periode.',
  ],
  tips: [
    'Tarik bandul dengan simpangan kecil, paling besar 15°.',
    'Mengukur 10 ayunan lalu membaginya dengan 10 lebih teliti daripada mengukur satu ayunan.',
    'Ganti tali dengan bandul yang sama, lalu ganti bandul dengan tali yang sama, dan bandingkan periodenya.',
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
  observationColumns: [
    { key: 'panjang', label: 'Panjang tali L (m)' },
    { key: 'massa', label: 'Massa bandul (g)' },
    { key: 'waktu', label: 'Waktu 10 ayunan (s)' },
    { key: 'periode', label: 'Periode T (s)' },
    { key: 'periodeKuadrat', label: 'T² (s²)' },
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
      run: (w, bob, string) =>
        bobOn(w, string)
          ? reject('Ujung tali ini sudah ada bandulnya.')
          : ok(update(moveTo(w, bob, string), bob, STILL_BOB)),
    },
    {
      source: 'stopwatch',
      target: STAND,
      run: (w, id) => {
        const placed = update(moveTo(w, id, STAND), id, IDLE_STOPWATCH)
        if (swinging(placed)) return startCounting(placed)
        return ok(placed, {
          hint: 'Stopwatch siap. Lepas bandul, lalu tap stopwatch untuk menghitung 10 ayunan.',
        })
      },
    },
  ],
  pull: {
    bob: (w, bob, value) => {
      const hang = hangingBob(w)
      if (hang?.bob !== bob) {
        return reject(
          'Gantung tali di statif dan pasang bandul di ujungnya dulu.',
        )
      }
      const angle = Math.abs(value)
      if (angle > MAX_ANGLE) {
        return reject(
          `Simpangan paling besar ${MAX_ANGLE}°. Rumus T = 2π√(L ÷ g) hanya berlaku untuk simpangan kecil.`,
        )
      }
      return ok(update(stopCounting(w), bob, { ...STILL_BOB, angle }))
    },
  },
  release: {
    bob: (w, bob) => {
      if (bool(w, bob, 'swinging')) return ok(w)
      if (hangingBob(w)?.bob !== bob || num(w, bob, 'angle') === 0) {
        return reject('Tarik bandul ke samping dulu agar bisa berayun.')
      }
      return ok(update(w, bob, { swinging: true, phase: 0 }))
    },
  },
  use: {
    bob: (w, bob) =>
      bool(w, bob, 'swinging')
        ? ok(update(stopCounting(w), bob, STILL_BOB))
        : reject('Tarik bandul ke samping, lalu lepaskan agar berayun.'),
    stopwatch: (w, id) => {
      if (w.items[id].at !== STAND)
        return reject('Seret stopwatch ke statif dulu.')
      if (bool(w, id, 'counting')) return ok(update(w, id, { counting: false }))
      if (num(w, id, 'elapsed') > 0) return ok(update(w, id, IDLE_STOPWATCH))
      return startCounting(w)
    },
  },
  guard: (w, id, target) => {
    const hang = swinging(w)
    if (!hang) return null
    const busy = [hang.bob, hang.string, CLAMP]
    return busy.includes(id) || busy.includes(target)
      ? 'Hentikan bandul dulu sebelum mengganti tali atau bandul.'
      : null
  },
  tick: (w, dt) => {
    const hang = swinging(w)
    if (!hang) return ok(w)
    const { bob, string } = hang
    let next = update(w, bob, { phase: num(w, bob, 'phase') + dt })
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
      explanation: {
        result: `Dengan tali ${fmt(length, 1)} m dan bandul ${mass} g, 10 ayunan butuh ${fmt(total, 2)} s. Jadi periode T = ${fmt(total, 2)} ÷ 10 = ${fmt(T, 2)} s.`,
        reason: REASON,
        formula: 'T = 2π × √(L ÷ g)',
      },
    })
  },
  isActive: (w) => swinging(w) !== null,
  view: (w) => {
    const view: Record<string, Record<string, string | number>> = {}
    const hang = hangingBob(w)
    let current = 0
    for (const b of BOBS) {
      const string = w.items[b.id].at
      const amplitude = num(w, b.id, 'angle')
      const angle =
        bool(w, b.id, 'swinging') && isString(string)
          ? angleAt(amplitude, lengthOf(string), num(w, b.id, 'phase'))
          : amplitude
      if (hang?.bob === b.id) current = angle
      view[b.id] = {
        label: `Bandul ${b.mass} g`,
        angle: round(angle, 2),
        action: bool(w, b.id, 'swinging') ? 'Hentikan' : '',
      }
    }
    view.protractor = { reading: `${fmt(Math.abs(current), 0)}°` }
    const counting = bool(w, STOPWATCH, 'counting')
    const elapsed = num(w, STOPWATCH, 'elapsed')
    view[STOPWATCH] = {
      reading: `${fmt(elapsed, 2)} s`,
      label: `${num(w, STOPWATCH, 'swings')}/${SWINGS} ayunan`,
      action: counting ? 'Berhenti' : elapsed > 0 ? 'Nol-kan' : 'Mulai',
    }
    return view
  },
}
