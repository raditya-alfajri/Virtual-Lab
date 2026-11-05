import type { Experiment, ItemDef, Result, World } from '../types'
import {
  bool,
  fmt,
  mixColor,
  moveTo,
  num,
  ok,
  reject,
  round,
  str,
  update,
} from '../instruments'

// Nilai dari PRD bagian 7 (K2).
export const MOLAR_MASS = 160 // g/mol, CuSO₄
export const MAX_MASS = 16 // g
export const MAX_VOLUME = 250 // mL, kapasitas gelas ukur dan batas volume larutan
export const FILL_VOLUME = 50 // mL per isian gelas ukur
// TODO(cek guru): lama pelarutan tidak ada di PRD. Satu gerakan aduk = 1 detik
// mengaduk; CuSO₄ larut sempurna setelah 5 detik diaduk (5 gerakan).
export const STIR_SECONDS = 1
export const DISSOLVE_SECONDS = 5

// Rumus K2.
export const moles = (mass: number, mr = MOLAR_MASS) => mass / mr
export const molarity = (mass: number, volumeMl: number, mr = MOLAR_MASS) =>
  moles(mass, mr) / (volumeMl / 1000)

// TODO(cek guru): nama dan warna biru CuSO₄ untuk tiap rentang konsentrasi (M).
const SHADES = [
  { below: 0.1, name: 'biru sangat muda', color: '#D6ECFA' },
  { below: 0.25, name: 'biru muda', color: '#9FD3F2' },
  { below: 0.5, name: 'biru', color: '#4FA8E0' },
  { below: 1, name: 'biru pekat', color: '#1F6FC0' },
  { below: Infinity, name: 'biru tua', color: '#0D3B8C' },
]
export const shadeOf = (m: number) => SHADES.find((s) => m < s.below)!

const WATER_COLOR = '#EEF6FB'
// Sisa pembulatan saat progres dijumlahkan dari banyak tick kecil.
const EPSILON = 1e-9

const BALANCE = 'balance'
const BENCH = 'bench'
const BEAKER = 'beaker'
const CYLINDER = 'cylinder'
const WATCH_GLASS = 'watch-glass'
const STIRRER = 'stirrer'

const SPOONS = [
  { id: 'spoon-small', name: 'Sendok kecil', grams: 1 },
  { id: 'spoon-large', name: 'Sendok besar', grams: 4 },
]
const spoonGrams = (id: string) => SPOONS.find((s) => s.id === id)!.grams

const EMPTY_BEAKER = {
  water: 0,
  solute: 0,
  progress: 0,
  stir: 0,
  from: WATER_COLOR,
  diluted: false,
}

// Angka tanpa nol berlebih untuk siswa: show(0.00625, 5) → '0,00625'.
const show = (x: number, decimals: number) =>
  String(round(x, decimals)).replace('.', ',')

const water = (w: World) => num(w, BEAKER, 'water')
const solute = (w: World) => num(w, BEAKER, 'solute')
const concentration = (w: World) => round(molarity(solute(w), water(w)), 3)
const dissolved = (w: World) =>
  water(w) > 0 && solute(w) > 0 && num(w, BEAKER, 'progress') >= 1

function beakerColor(w: World): string {
  const from = str(w, BEAKER, 'from')
  if (!water(w) || !solute(w)) return from
  const target = shadeOf(concentration(w)).color
  return mixColor(from, target, num(w, BEAKER, 'progress'))
}

// Isi gelas berubah: larutan harus diaduk lagi, warna berangkat dari warna sekarang.
function addToBeaker(w: World, patch: { water?: number; solute?: number }) {
  const diluted =
    patch.water !== undefined && (dissolved(w) || bool(w, BEAKER, 'diluted'))
  return update(w, BEAKER, {
    ...patch,
    from: beakerColor(w),
    progress: 0,
    diluted,
  })
}

function stir(w: World): Result {
  if (!water(w) && !solute(w)) {
    return reject(
      'Gelas kimia masih kosong. Mengaduk gelas kosong tidak berpengaruh.',
    )
  }
  if (!solute(w)) {
    return reject(
      'Belum ada CuSO₄ di gelas kimia. Tuang CuSO₄ dari kaca arloji dulu.',
    )
  }
  if (!water(w)) {
    return reject(
      'Belum ada air untuk melarutkan CuSO₄. Tuang air dari gelas ukur dulu.',
    )
  }
  if (dissolved(w)) {
    return reject(
      'CuSO₄ sudah larut sempurna. Tambah air atau CuSO₄ kalau ingin membuat larutan baru.',
    )
  }
  return ok(update(w, BEAKER, { stir: num(w, BEAKER, 'stir') + STIR_SECONDS }))
}

const REASON =
  'Molaritas menyatakan banyaknya mol zat terlarut dalam setiap liter larutan. Makin banyak CuSO₄ yang dilarutkan atau makin sedikit airnya, makin besar konsentrasinya dan makin pekat warna birunya.'
const DILUTION_REASON =
  'Saat larutan diencerkan, jumlah mol CuSO₄ tetap, tetapi volumenya bertambah. Karena itu konsentrasi turun dan warna biru makin muda (M₁ × V₁ = M₂ × V₂).'

function measure(w: World): Result {
  const mass = solute(w)
  const volume = water(w)
  const mol = moles(mass)
  const m = concentration(w)
  const shade = shadeOf(m).name
  const liters = volume / 1000
  return ok(w, {
    record: {
      massa: mass,
      volume,
      mol: round(mol, 5),
      konsentrasi: m,
      warna: shade,
    },
    explanation: {
      result: `${show(mass, 2)} g CuSO₄ = ${show(mass, 2)} ÷ ${MOLAR_MASS} = ${show(mol, 5)} mol. Dilarutkan dalam ${volume} mL = ${show(liters, 3)} L, jadi M = ${show(mol, 5)} ÷ ${show(liters, 3)} = ${show(m, 3)} M. Larutan berwarna ${shade}.`,
      reason: bool(w, BEAKER, 'diluted') ? DILUTION_REASON : REASON,
      formula: 'M = (m ÷ Mr) ÷ V',
    },
  })
}

function beakerLabel(w: World): string {
  if (!water(w) && !solute(w)) return 'Kosong'
  if (!water(w)) return `${show(solute(w), 2)} g CuSO₄ padat`
  if (!solute(w)) return `Air ${water(w)} mL`
  if (dissolved(w)) return `Larut sempurna · ${shadeOf(concentration(w)).name}`
  const percent = Math.floor(num(w, BEAKER, 'progress') * 100)
  if (num(w, BEAKER, 'stir') > 0) return `Melarut… ${percent}%`
  return percent > 0 ? `Aduk lagi · ${percent}%` : 'Belum larut, aduk'
}

const items: ItemDef[] = [
  {
    id: 'cuso4',
    kind: 'cuso4',
    name: 'Wadah CuSO₄',
    props: { mr: MOLAR_MASS },
  },
  ...SPOONS.map((s) => ({
    id: s.id,
    kind: 'spoon',
    name: `${s.name} (${s.grams} g)`,
    props: { grams: s.grams },
    state: { full: false },
  })),
  {
    id: WATCH_GLASS,
    kind: 'watch-glass',
    name: 'Kaca arloji',
    state: { mass: 0 },
  },
  { id: 'water', kind: 'water', name: 'Botol air suling' },
  {
    id: CYLINDER,
    kind: 'cylinder',
    name: 'Gelas ukur 250 mL',
    state: { volume: 0 },
  },
  { id: BEAKER, kind: 'beaker', name: 'Gelas kimia', state: EMPTY_BEAKER },
  { id: STIRRER, kind: 'stirrer', name: 'Batang pengaduk' },
]

export const solutionConcentration: Experiment = {
  id: 'konsentrasi-larutan',
  title: 'Konsentrasi Larutan',
  subject: 'kimia',
  topic: 'Larutan',
  summary:
    'Timbang CuSO₄, larutkan dalam air, lalu hitung dan bandingkan molaritasnya, termasuk saat diencerkan.',
  description:
    'Teh manis bisa terasa terlalu manis atau kurang manis tergantung banyaknya gula dan air. Di eksperimen ini kamu menimbang CuSO₄ dengan neraca, mengukur air dengan gelas ukur, mengaduk sampai larut, lalu membandingkan konsentrasi larutan dari warna birunya.',
  previewImage: '/img/konsentrasi-larutan.webp',
  objectives: [
    'Menghitung molaritas larutan dari massa zat terlarut dan volume larutan.',
    'Membandingkan konsentrasi larutan dan pengaruh pengenceran.',
  ],
  tips: [
    'Taruh kaca arloji di neraca sebelum menuang CuSO₄ agar massanya terbaca.',
    'Aduk terus sampai warna biru merata; data tercatat saat CuSO₄ larut sempurna.',
    'Untuk mengencerkan, tambah air dari gelas ukur ke larutan lalu aduk lagi.',
  ],
  concepts: [
    {
      title: 'Mol',
      content:
        'Mol adalah satuan jumlah zat. Jumlah mol didapat dari massa zat dibagi massa molekul relatifnya (Mr). Mr CuSO₄ = 160 g/mol.',
      formula: 'n = m ÷ Mr',
    },
    {
      title: 'Molaritas',
      content:
        'Molaritas (M) adalah jumlah mol zat terlarut dalam setiap liter larutan. Satuannya mol/L atau M.',
      formula: 'M = (m ÷ Mr) ÷ V',
    },
    {
      title: 'Pengenceran',
      content:
        'Menambah pelarut tidak mengubah jumlah mol zat terlarut, tetapi menambah volume, sehingga konsentrasi turun.',
      formula: 'M₁ × V₁ = M₂ × V₂',
    },
  ],
  observationColumns: [
    { key: 'massa', label: 'Massa CuSO₄ (g)' },
    { key: 'volume', label: 'Volume (mL)' },
    { key: 'mol', label: 'Mol (mol)' },
    { key: 'konsentrasi', label: 'Konsentrasi (M)' },
    { key: 'warna', label: 'Warna' },
  ],
  items,
  zones: [
    {
      id: BALANCE,
      name: 'Neraca digital',
      accepts: ['watch-glass'],
      capacity: 1,
    },
    {
      id: BENCH,
      name: 'Meja kerja',
      accepts: ['beaker', 'cylinder', 'watch-glass'],
    },
  ],
  interactions: [
    {
      source: 'spoon',
      target: 'cuso4',
      run: (w, spoon) => ok(update(w, spoon, { full: true })),
    },
    {
      source: 'spoon',
      target: 'watch-glass',
      run: (w, spoon, glass) => {
        if (!bool(w, spoon, 'full')) {
          return reject('Sendok masih kosong. Ambil CuSO₄ dari wadahnya dulu.')
        }
        if (w.items[glass].at !== BALANCE) {
          return reject(
            'Taruh kaca arloji di neraca dulu agar massa CuSO₄ terbaca.',
          )
        }
        const mass = num(w, glass, 'mass') + spoonGrams(spoon)
        if (mass > MAX_MASS) {
          return reject(
            `Massa CuSO₄ paling banyak ${MAX_MASS} g. Di kaca arloji sudah ada ${show(num(w, glass, 'mass'), 2)} g.`,
          )
        }
        return ok(update(update(w, glass, { mass }), spoon, { full: false }))
      },
    },
    {
      source: 'spoon',
      target: 'beaker',
      run: () =>
        reject(
          'Timbang CuSO₄ di kaca arloji di atas neraca dulu agar massanya diketahui.',
        ),
    },
    {
      source: 'cuso4',
      target: 'watch-glass',
      run: () => reject('Ambil CuSO₄ dengan sendok.'),
    },
    {
      source: 'cuso4',
      target: 'beaker',
      run: () => reject('Ambil CuSO₄ dengan sendok.'),
    },
    {
      source: 'watch-glass',
      target: 'beaker',
      run: (w, glass) => {
        const mass = num(w, glass, 'mass')
        if (!mass)
          return reject('Kaca arloji masih kosong. Timbang CuSO₄ dulu.')
        if (w.items[BEAKER].at !== BENCH) {
          return reject('Taruh gelas kimia di meja kerja dulu.')
        }
        if (solute(w) + mass > MAX_MASS) {
          return reject(
            `Gelas kimia paling banyak berisi ${MAX_MASS} g CuSO₄. Sekarang sudah ada ${show(solute(w), 2)} g.`,
          )
        }
        const next = addToBeaker(w, { solute: solute(w) + mass })
        return ok(update(next, glass, { mass: 0 }))
      },
    },
    {
      source: 'water',
      target: 'cylinder',
      run: (w, _water, cylinder) => {
        if (w.items[cylinder].at !== BENCH) {
          return reject(
            'Taruh gelas ukur di meja kerja dulu agar skalanya terbaca tepat.',
          )
        }
        const volume = num(w, cylinder, 'volume') + FILL_VOLUME
        if (volume > MAX_VOLUME) {
          return reject(
            `Gelas ukur sudah berisi ${MAX_VOLUME} mL, batas skalanya.`,
          )
        }
        return ok(update(w, cylinder, { volume }))
      },
    },
    {
      source: 'water',
      target: 'beaker',
      run: () =>
        reject('Ukur air dengan gelas ukur dulu agar volumenya diketahui.'),
    },
    {
      source: 'cylinder',
      target: 'beaker',
      run: (w, cylinder) => {
        const volume = num(w, cylinder, 'volume')
        if (!volume) {
          return reject(
            'Gelas ukur masih kosong. Isi dulu dari botol air suling.',
          )
        }
        if (w.items[BEAKER].at !== BENCH) {
          return reject('Taruh gelas kimia di meja kerja dulu.')
        }
        if (water(w) + volume > MAX_VOLUME) {
          return reject(
            `Volume larutan paling banyak ${MAX_VOLUME} mL. Di gelas kimia sudah ada ${water(w)} mL air.`,
          )
        }
        const next = addToBeaker(w, { water: water(w) + volume })
        return ok(update(next, cylinder, { volume: 0 }))
      },
    },
    {
      source: 'stirrer',
      target: 'beaker',
      run: (w, stirrer) => {
        const result = stir(w)
        if ('reject' in result) return result
        return ok(moveTo(result.world, stirrer, BEAKER))
      },
    },
  ],
  use: {
    stirrer: (w, stirrer) =>
      w.items[stirrer].at === BEAKER
        ? stir(w)
        : reject('Masukkan batang pengaduk ke gelas kimia dulu.'),
  },
  tick: (w, dt) => {
    const budget = num(w, BEAKER, 'stir')
    if (budget <= 0) return ok(w)
    const used = Math.min(dt, budget)
    const raw = num(w, BEAKER, 'progress') + used / DISSOLVE_SECONDS
    const progress = raw >= 1 - EPSILON ? 1 : raw
    const left = budget - used
    const next = update(w, BEAKER, {
      progress,
      stir: progress === 1 || left < EPSILON ? 0 : left,
    })
    return progress === 1 ? measure(next) : ok(next)
  },
  isActive: (w) => num(w, BEAKER, 'stir') > 0,
  view: (w) => {
    const glass = num(w, WATCH_GLASS, 'mass')
    const volume = num(w, CYLINDER, 'volume')
    const view: Record<string, Record<string, string | number>> = {
      [BEAKER]: {
        label: beakerLabel(w),
        color: beakerColor(w),
        level: water(w) / MAX_VOLUME,
      },
      [WATCH_GLASS]:
        w.items[WATCH_GLASS].at === BALANCE
          ? { label: 'Di neraca', reading: `${fmt(glass, 2)} g` }
          : { label: glass ? `${show(glass, 2)} g CuSO₄` : 'Kosong' },
      [CYLINDER]: {
        color: WATER_COLOR,
        level: volume / MAX_VOLUME,
        reading: `${volume} mL`,
      },
      [STIRRER]: { action: 'Aduk' },
    }
    for (const s of SPOONS) {
      view[s.id] = {
        label: bool(w, s.id, 'full') ? `Berisi ${s.grams} g CuSO₄` : 'Kosong',
      }
    }
    return view
  },
}
