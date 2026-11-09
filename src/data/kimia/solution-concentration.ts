import type {
  Experiment,
  Interaction,
  ItemState,
  ItemView,
  Result,
  World,
} from '../types'

/** Molar mass of CuSO₄ in g/mol. */
export const MR_CUSO4 = 160
/**
 * Most CuSO₄ the watch glass, and the beaker in total, may hold.
 * TODO(cek guru): 16 g in a small volume (e.g. 50 mL) may exceed the
 * solubility of CuSO₄ at room temperature. Kept at 16 g for now.
 */
export const MAX_MASS = 16
/** Capacity of both the measuring cylinder and the beaker, in mL. */
export const MAX_VOLUME = 250
/** Water added to the cylinder by one pour from the bottle, in mL. */
export const POUR_VOLUME = 50
/** Taps on the stirrer needed to dissolve the CuSO₄ completely. */
export const DISSOLVE_STIRS = 5

/**
 * Solution colour by concentration (M). Ordered from darkest; the first level
 * whose `min` the concentration reaches wins.
 */
export const COLOR_LEVELS = [
  { min: 1, name: 'Biru tua', hex: '#0d47a1' },
  { min: 0.5, name: 'Biru', hex: '#1e88e5' },
  { min: 0.2, name: 'Biru muda', hex: '#64b5f6' },
  { min: 0, name: 'Biru pucat', hex: '#c6e2fb' },
] as const

const WATER_COLOR = '#eaf4fa'
const CRYSTAL_COLOR = '#1565c0'

const BEAKER = 'beaker'
const WATCH_GLASS = 'watch-glass'
const BALANCE = 'balance'

const STIRRING_LINE = 'k2-stirring-started'
const DISSOLVED_LINE = 'k2-dissolved'
const DILUTION_LINE = 'k2-dilution'

type Beaker = {
  mass: number
  volume: number
  stirs: number
  /** Mass and volume that were already dissolved before the last addition. */
  baseMass: number
  baseVolume: number
}

const EMPTY_BEAKER: ItemState = {
  mass: 0,
  volume: 0,
  stirs: 0,
  baseMass: 0,
  baseVolume: 0,
}

function readBeaker(world: World): Beaker {
  const s = world.items[BEAKER].state
  return {
    mass: Number(s.mass),
    volume: Number(s.volume),
    stirs: Number(s.stirs),
    baseMass: Number(s.baseMass),
    baseVolume: Number(s.baseVolume),
  }
}

const isDissolved = (b: Beaker) => b.stirs >= DISSOLVE_STIRS
const molOf = (mass: number) => mass / MR_CUSO4

/** Written as one division so whole-number inputs give exact results. */
function concentrationOf(mass: number, volume: number): number {
  return volume > 0 ? (mass * 1000) / (MR_CUSO4 * volume) : 0
}

/** Rounds half up and uses a decimal comma, e.g. 0.0125 → "0,013". */
function formatDecimal(value: number, digits: number): string {
  const factor = 10 ** digits
  const rounded = Math.round(value * factor + 1e-9) / factor
  return rounded.toFixed(digits).replace('.', ',')
}

function colorLevel(concentration: number) {
  return (
    COLOR_LEVELS.find((level) => concentration >= level.min) ??
    COLOR_LEVELS[COLOR_LEVELS.length - 1]
  )
}

function colorHex(concentration: number): string {
  return concentration > 0 ? colorLevel(concentration).hex : WATER_COLOR
}

function mixHex(from: string, to: string, t: number): string {
  const channel = (hex: string, i: number) =>
    parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  let out = '#'
  for (let i = 0; i < 3; i++) {
    const value = Math.round(
      channel(from, i) + (channel(to, i) - channel(from, i)) * t,
    )
    out += value.toString(16).padStart(2, '0')
  }
  return out
}

function patchItem(world: World, id: string, patch: ItemState): World {
  const item = world.items[id]
  return {
    ...world,
    items: {
      ...world.items,
      [id]: { ...item, state: { ...item.state, ...patch } },
    },
  }
}

/**
 * Adds CuSO₄ or water to the beaker. Adding to a fully dissolved solution
 * starts a new dissolving process from what was already dissolved.
 */
function addToBeaker(
  world: World,
  add: { mass?: number; volume?: number },
): World {
  const b = readBeaker(world)
  const patch: ItemState = {
    mass: b.mass + (add.mass ?? 0),
    volume: b.volume + (add.volume ?? 0),
  }
  if (isDissolved(b)) {
    patch.stirs = 0
    patch.baseMass = b.mass
    patch.baseVolume = b.volume
  }
  return patchItem(world, BEAKER, patch)
}

function stir(world: World): Result {
  if (world.items.stirrer.at !== BEAKER) {
    return {
      reject:
        'Masukkan batang pengaduk ke gelas kimia dulu, lalu ketuk untuk mengaduk.',
    }
  }
  const b = readBeaker(world)
  if (!b.mass && !b.volume) return { reject: 'Gelas kimia masih kosong.' }
  if (!b.mass) return { reject: 'Masukkan CuSO₄ dulu ke gelas kimia.' }
  if (!b.volume) return { reject: 'Tuang air dulu ke gelas kimia.' }
  if (isDissolved(b)) return { world }

  const stirs = b.stirs + 1
  const next = patchItem(world, BEAKER, { stirs })
  if (stirs === 1) {
    return {
      world: next,
      events: [
        { type: 'stirring-started', itemId: BEAKER, lineId: STIRRING_LINE },
      ],
      explanation: {
        result: 'Kristal CuSO₄ mulai larut.',
        reason:
          'Mengaduk membantu partikel CuSO₄ menyebar merata ke seluruh air.',
      },
    }
  }
  if (stirs < DISSOLVE_STIRS) return { world: next }

  const concentration = concentrationOf(b.mass, b.volume)
  const color = colorLevel(concentration).name
  const mol = formatDecimal(molOf(b.mass), 3)
  const molarity = formatDecimal(concentration, 2)
  const liters = formatDecimal(b.volume / 1000, 3)
  return {
    world: next,
    record: {
      massa: b.mass,
      volume: b.volume,
      mol,
      konsentrasi: molarity,
      warna: color,
    },
    events: [{ type: 'dissolved', itemId: BEAKER, lineId: DISSOLVED_LINE }],
    explanation: {
      result: `Larut sempurna. Konsentrasi larutan ${molarity} M dan berwarna ${color.toLowerCase()}.`,
      reason: `${b.mass} g CuSO₄ ÷ ${MR_CUSO4} = ${mol} mol, dilarutkan dalam ${b.volume} mL (${liters} L) air.`,
      formula: `M = ${mol} mol ÷ ${liters} L = ${molarity} M`,
    },
  }
}

const interactions: Interaction[] = [
  {
    source: 'spoon',
    target: 'cuso4',
    run: (world, spoonId) => {
      const spoon = world.items[spoonId].state
      if (Number(spoon.load) > 0) {
        return {
          reject: 'Sendok masih berisi CuSO₄. Tuang dulu ke kaca arloji.',
        }
      }
      return { world: patchItem(world, spoonId, { load: spoon.size }) }
    },
  },
  {
    source: 'spoon',
    target: WATCH_GLASS,
    run: (world, spoonId, glassId) => {
      const load = Number(world.items[spoonId].state.load)
      if (!load) {
        return {
          reject: 'Sendok masih kosong. Ambil CuSO₄ dulu dari wadahnya.',
        }
      }
      const glass = world.items[glassId]
      if (glass.at !== BALANCE) {
        return {
          reject:
            'Letakkan kaca arloji di atas neraca dulu supaya CuSO₄ bisa ditimbang.',
        }
      }
      const mass = Number(glass.state.mass) + load
      if (mass > MAX_MASS) {
        return { reject: `Massa CuSO₄ di kaca arloji maksimal ${MAX_MASS} g.` }
      }
      const filled = patchItem(world, glassId, { mass })
      return { world: patchItem(filled, spoonId, { load: 0 }) }
    },
  },
  {
    source: 'spoon',
    target: BEAKER,
    run: () => ({
      reject: 'Timbang CuSO₄ dulu di atas kaca arloji sebelum dimasukkan.',
    }),
  },
  {
    source: 'water',
    target: 'cylinder',
    run: (world, _waterId, cylinderId) => {
      const volume = Number(world.items[cylinderId].state.volume) + POUR_VOLUME
      if (volume > MAX_VOLUME) {
        return { reject: `Gelas ukur hanya muat ${MAX_VOLUME} mL.` }
      }
      return { world: patchItem(world, cylinderId, { volume }) }
    },
  },
  {
    source: 'water',
    target: BEAKER,
    run: () => ({
      reject: 'Ukur airnya dulu dengan gelas ukur sebelum dituang.',
    }),
  },
  {
    source: 'cylinder',
    target: BEAKER,
    run: (world, cylinderId) => {
      const poured = Number(world.items[cylinderId].state.volume)
      if (!poured) {
        return {
          reject: 'Gelas ukur masih kosong. Isi dulu dengan air suling.',
        }
      }
      const before = readBeaker(world)
      const volume = before.volume + poured
      if (volume > MAX_VOLUME) {
        return {
          reject: `Gelas kimia hanya muat ${MAX_VOLUME} mL. Air di gelas ukur terlalu banyak.`,
        }
      }
      const filled = addToBeaker(world, { volume: poured })
      const next = patchItem(filled, cylinderId, { volume: 0 })
      if (!isDissolved(before)) return { world: next }
      return {
        world: next,
        events: [{ type: 'dilution', itemId: BEAKER, lineId: DILUTION_LINE }],
        explanation: {
          result: `Volume larutan bertambah menjadi ${volume} mL.`,
          reason:
            'Jumlah mol CuSO₄ tetap, tetapi sekarang tersebar di volume yang lebih besar, jadi konsentrasinya turun.',
          formula: 'M₁ × V₁ = M₂ × V₂',
        },
      }
    },
  },
  {
    source: WATCH_GLASS,
    target: BEAKER,
    run: (world, glassId) => {
      const added = Number(world.items[glassId].state.mass)
      if (!added) {
        return {
          reject: 'Kaca arloji masih kosong. Timbang CuSO₄ dulu di atasnya.',
        }
      }
      if (readBeaker(world).mass + added > MAX_MASS) {
        return { reject: `CuSO₄ di gelas kimia maksimal ${MAX_MASS} g.` }
      }
      const filled = addToBeaker(world, { mass: added })
      return { world: patchItem(filled, glassId, { mass: 0 }) }
    },
  },
  {
    source: 'stirrer',
    target: BEAKER,
    run: (world, stirrerId) => {
      const stirrer = world.items[stirrerId]
      if (stirrer.at === BEAKER) return { world }
      return {
        world: {
          ...world,
          items: { ...world.items, [stirrerId]: { ...stirrer, at: BEAKER } },
        },
      }
    },
  },
]

function spoonView(state: ItemState): ItemView {
  const load = Number(state.load)
  return {
    label: load ? `Berisi ${load} g` : 'Kosong',
    color: load ? CRYSTAL_COLOR : undefined,
    level: load ? 1 : 0,
  }
}

function beakerView(b: Beaker): ItemView {
  const progress = b.mass && b.volume ? b.stirs / DISSOLVE_STIRS : 0
  let label: string
  if (!b.mass && !b.volume) label = 'Kosong'
  else if (!b.mass) label = 'Air suling'
  else if (!b.volume) label = 'Belum ada air'
  else if (progress >= 1) label = 'Larut sempurna'
  else label = `Larut ${Math.round(progress * 100)}%`

  let color: string | undefined
  if (b.volume && !b.mass) color = WATER_COLOR
  else if (b.volume) {
    color = mixHex(
      colorHex(concentrationOf(b.baseMass, b.baseVolume)),
      colorHex(concentrationOf(b.mass, b.volume)),
      progress,
    )
  }

  return {
    label,
    color,
    level: b.volume / MAX_VOLUME,
    // Share of the CuSO₄ still lying undissolved as crystals.
    solid: b.mass ? (1 - b.baseMass / b.mass) * (1 - progress) : 0,
  }
}

export const solutionConcentration: Experiment = {
  id: 'konsentrasi-larutan',
  subject: 'kimia',
  title: 'Konsentrasi Larutan',
  topic: 'Larutan',
  summary: 'Buat larutan CuSO₄, hitung konsentrasinya, lalu coba pengenceran.',
  description:
    'Di praktikum ini kamu membuat larutan tembaga(II) sulfat (CuSO₄). Timbang kristal CuSO₄ di atas kaca arloji, ukur air suling dengan gelas ukur, campurkan keduanya di gelas kimia, lalu aduk sampai larut sempurna. Setelah itu, tambahkan air untuk melihat apa yang terjadi pada konsentrasi dan warna larutan.',
  previewImage: '/img/lab/konsentrasi-larutan.webp',
  objectives: [
    'Membuat larutan CuSO₄ dengan massa zat terlarut dan volume air tertentu.',
    'Menghitung jumlah mol dan konsentrasi molar (M) larutan.',
    'Mengamati pengaruh pengenceran terhadap konsentrasi dan warna larutan.',
  ],
  tips: [
    'Letakkan kaca arloji di atas neraca sebelum memasukkan CuSO₄ supaya massanya terbaca.',
    'Gelas ukur terisi 50 mL setiap kali air dituang dari botol.',
    'Masukkan batang pengaduk ke gelas kimia, lalu ketuk batang pengaduk berkali-kali sampai larut sempurna.',
    'Setelah larut sempurna, tambahkan air lalu aduk lagi untuk mendapatkan data pengenceran.',
  ],

  items: [
    { id: 'cuso4', kind: 'cuso4', name: 'Wadah CuSO₄' },
    {
      id: 'spoon-small',
      kind: 'spoon',
      name: 'Sendok kecil (1 g)',
      state: { size: 1, load: 0 },
    },
    {
      id: 'spoon-large',
      kind: 'spoon',
      name: 'Sendok besar (4 g)',
      state: { size: 4, load: 0 },
    },
    {
      id: WATCH_GLASS,
      kind: WATCH_GLASS,
      name: 'Kaca arloji',
      state: { mass: 0 },
    },
    { id: 'water', kind: 'bottle', name: 'Botol air suling' },
    {
      id: 'cylinder',
      kind: 'cylinder',
      name: 'Gelas ukur 250 mL',
      start: 'bench',
      state: { volume: 0 },
    },
    {
      id: BEAKER,
      kind: BEAKER,
      name: 'Gelas kimia',
      start: 'bench',
      state: EMPTY_BEAKER,
    },
    { id: 'stirrer', kind: 'stirrer', name: 'Batang pengaduk' },
  ],
  zones: [
    {
      id: BALANCE,
      name: 'Neraca digital',
      accepts: [WATCH_GLASS],
      capacity: 1,
    },
    {
      id: 'bench',
      name: 'Meja kerja',
      accepts: ['cylinder', BEAKER, WATCH_GLASS, 'stirrer'],
    },
  ],
  interactions,
  use: {
    stirrer: (world) => stir(world),
  },

  view: (world) => {
    const glass = world.items[WATCH_GLASS]
    const glassMass = Number(glass.state.mass)
    const cylinderVolume = Number(world.items.cylinder.state.volume)
    const stirring = world.items.stirrer.at === BEAKER
    return {
      'spoon-small': spoonView(world.items['spoon-small'].state),
      'spoon-large': spoonView(world.items['spoon-large'].state),
      [WATCH_GLASS]: {
        reading:
          glass.at === BALANCE ? `${formatDecimal(glassMass, 2)} g` : undefined,
        color: glassMass ? CRYSTAL_COLOR : undefined,
        level: glassMass / MAX_MASS,
      },
      cylinder: {
        reading: `${cylinderVolume} mL`,
        color: cylinderVolume ? WATER_COLOR : undefined,
        level: cylinderVolume / MAX_VOLUME,
      },
      [BEAKER]: beakerView(readBeaker(world)),
      stirrer: {
        label: stirring ? 'Ketuk untuk mengaduk' : undefined,
        active: stirring,
      },
    }
  },

  columns: [
    { key: 'massa', label: 'Massa (g)' },
    { key: 'volume', label: 'Volume (mL)' },
    { key: 'mol', label: 'Mol' },
    { key: 'konsentrasi', label: 'Konsentrasi (M)' },
    { key: 'warna', label: 'Warna' },
  ],
  prediction: {
    question:
      'Kalau airnya ditambah dua kali lipat, warnanya jadi lebih pekat atau lebih pucat?',
    options: ['Lebih pekat', 'Lebih pucat', 'Sama saja'],
  },
  lines: [
    {
      id: STIRRING_LINE,
      text: 'Kristal CuSO₄ mulai larut. Mengaduk membantu partikelnya menyebar merata ke seluruh air. Terus aduk sampai larut sempurna.',
    },
    {
      id: DISSOLVED_LINE,
      text: 'Larut sempurna! Warna biru berasal dari ion tembaga di dalam larutan. Makin banyak zat terlarut, makin pekat birunya. Lihat konsentrasinya di tabel.',
    },
    {
      id: DILUTION_LINE,
      text: 'Airnya bertambah, jadi zat terlarut tersebar di volume yang lebih besar dan konsentrasinya turun. Aduk lagi, lalu bandingkan warnanya dengan sebelumnya.',
    },
  ],
  concepts: [
    {
      title: 'Konsentrasi molar',
      content:
        'Konsentrasi molar (molaritas, M) menyatakan banyaknya mol zat terlarut dalam setiap 1 liter larutan. Makin besar molaritasnya, makin pekat larutannya. Pada larutan CuSO₄, larutan yang lebih pekat berwarna biru lebih tua.',
    },
    {
      title: 'Rumus molaritas',
      content:
        'Jumlah mol dihitung dari massa zat dibagi massa molekul relatifnya (Mr). Mr CuSO₄ adalah 160. Molaritas adalah jumlah mol dibagi volume larutan dalam liter. Contoh: 16 g CuSO₄ = 0,1 mol; jika dilarutkan dalam 100 mL (0,1 L), konsentrasinya 1 M.',
      formula: 'n = massa ÷ Mr,  M = n ÷ V (L)',
    },
    {
      title: 'Pengenceran',
      content:
        'Pengenceran adalah menambah pelarut ke dalam larutan. Jumlah mol zat terlarut tidak berubah, tetapi volumenya bertambah, sehingga konsentrasinya turun dan warnanya makin pucat. Jika volume dijadikan dua kali lipat, konsentrasinya menjadi setengahnya.',
      formula: 'M₁ × V₁ = M₂ × V₂',
    },
  ],
}
