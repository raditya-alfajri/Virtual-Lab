import type {
  Experiment,
  Explanation,
  ItemState,
  ItemView,
  LabEvent,
  World,
} from '../types'

export const COLOR_CHANGE_SECONDS = 1

type Solution = {
  name: string
  inline: string
  ph: number
  color: string
  reason: string
}

const SOLUTIONS: Record<string, Solution> = {
  cuka: {
    name: 'Cuka',
    inline: 'cuka',
    ph: 3,
    color: '#f4f1e8',
    reason: 'Cuka mengandung asam asetat yang melepaskan ion H⁺ di dalam air.',
  },
  jeruk: {
    name: 'Air jeruk',
    inline: 'air jeruk',
    ph: 4,
    color: '#fff2b3',
    reason: 'Air jeruk mengandung asam sitrat yang melepaskan ion H⁺.',
  },
  suling: {
    name: 'Air suling',
    inline: 'air suling',
    ph: 7,
    color: '#eaf4fa',
    reason: 'Jumlah ion H⁺ dan OH⁻ di air suling seimbang.',
  },
  sabun: {
    name: 'Air sabun',
    inline: 'air sabun',
    ph: 10,
    color: '#f1efe6',
    reason: 'Air sabun lebih banyak mengandung ion OH⁻ daripada ion H⁺.',
  },
  naoh: {
    name: 'NaOH encer',
    inline: 'NaOH encer',
    ph: 13,
    color: '#eef2f5',
    reason: 'NaOH melepaskan banyak ion OH⁻ di dalam air.',
  },
}

const INDICATOR_COLORS: Record<string, string> = {
  Merah: '#e53935',
  Jingga: '#fb8c00',
  Kuning: '#fdd835',
  Hijau: '#43a047',
  Biru: '#1e88e5',
  Ungu: '#6a1b9a',
}
const INDICATOR_ONLY_COLOR = '#d4edc9'

const TUBE_IDS = ['tube-1', 'tube-2', 'tube-3']
const EMPTY_TUBE: ItemState = {
  solution: '',
  ph: 0,
  indicator: false,
  progress: 0,
}
const EMPTY_PIPETTE: ItemState = { solution: '', ph: 0 }

const COLOR_LINE = 'k1-color-changed'
const resultLine = (solution: string) => `k1-result-${solution}`

function indicatorColor(ph: number): string {
  if (ph <= 3) return 'Merah'
  if (ph <= 5) return 'Jingga'
  if (ph < 7) return 'Kuning'
  if (ph === 7) return 'Hijau'
  if (ph <= 10) return 'Biru'
  return 'Ungu'
}

function natureOf(ph: number): string {
  if (ph < 7) return 'Asam'
  if (ph > 7) return 'Basa'
  return 'Netral'
}

function solutionOf(state: ItemState): Solution | undefined {
  return SOLUTIONS[String(state.solution)]
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

function filledTubeReject(tube: ItemState) {
  const inside = solutionOf(tube)
  return inside
    ? {
        reject: `Tabung ini sudah berisi ${inside.inline}. Satu tabung hanya untuk satu larutan.`,
      }
    : undefined
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

function tubeView(state: ItemState): ItemView {
  const solution = solutionOf(state)
  const indicator = state.indicator === true
  let color: string | undefined
  if (solution && indicator) {
    const target = INDICATOR_COLORS[indicatorColor(Number(state.ph))]
    color = mixHex(solution.color, target, Number(state.progress))
  } else if (solution) {
    color = solution.color
  } else if (indicator) {
    color = INDICATOR_ONLY_COLOR
  }
  return {
    label: solution?.name ?? (indicator ? 'Indikator' : 'Kosong'),
    color,
    level: (solution ? 0.5 : 0) + (indicator ? 0.1 : 0),
  }
}

function pipetteView(state: ItemState): ItemView {
  const solution = solutionOf(state)
  return {
    label: solution?.name ?? 'Kosong',
    color: solution?.color,
    level: solution ? 1 : 0,
  }
}

const bottle = (solution: string) => ({
  id: `bottle-${solution}`,
  kind: 'bottle',
  name: SOLUTIONS[solution].name,
  state: { solution, ph: SOLUTIONS[solution].ph },
})

export const acidBaseTest: Experiment = {
  id: 'uji-asam-basa',
  subject: 'kimia',
  title: 'Uji Asam dan Basa',
  topic: 'Asam & Basa',
  summary:
    'Uji lima larutan dengan indikator universal untuk mengetahui sifatnya.',
  description:
    'Di praktikum ini kamu menguji cuka, air jeruk, air suling, air sabun, dan NaOH encer. Masukkan larutan ke tabung reaksi, teteskan indikator universal, lalu cocokkan warnanya dengan kartu skala pH untuk mengetahui pH dan sifat tiap larutan.',
  previewImage: '/images/experiments/kimia/uji-asam-basa.png',
  objectives: [
    'Menguji sifat asam, basa, atau netral lima larutan dengan indikator universal.',
    'Menentukan pH larutan dengan mencocokkan warnanya ke kartu skala pH.',
    'Membandingkan tingkat keasaman larutan yang sering ditemui sehari-hari.',
  ],
  tips: [
    'Satu tabung hanya untuk satu larutan. Kosongkan tabung di wastafel sebelum dipakai lagi.',
    'Kosongkan pipet di wastafel sebelum mengambil larutan lain.',
    'Tunggu sampai warnanya berhenti berubah sebelum mencocokkan tabung ke kartu pH.',
  ],

  items: [
    ...TUBE_IDS.map((id, i) => ({
      id,
      kind: 'tube',
      name: `Tabung ${i + 1}`,
      start: `rack-${i + 1}`,
      state: EMPTY_TUBE,
    })),
    {
      id: 'pipette',
      kind: 'pipette',
      name: 'Pipet tetes',
      state: EMPTY_PIPETTE,
    },
    ...Object.keys(SOLUTIONS).map(bottle),
    { id: 'indicator', kind: 'indicator', name: 'Indikator universal' },
  ],
  zones: [
    ...TUBE_IDS.map((_, i) => ({
      id: `rack-${i + 1}`,
      name: 'Rak tabung',
      accepts: ['tube'],
      capacity: 1,
    })),
    { id: 'ph-card', name: 'Kartu skala pH', accepts: [] },
    { id: 'sink', name: 'Wastafel', accepts: [] },
  ],

  interactions: [
    {
      source: 'pipette',
      target: 'bottle',
      run: (world, pipetteId, bottleId) => {
        const pipette = world.items[pipetteId].state
        const source = world.items[bottleId].state
        if (pipette.solution === source.solution) return { world }
        const inside = solutionOf(pipette)
        if (inside) {
          return {
            reject: `Pipet masih berisi ${inside.inline}. Teteskan dulu ke tabung atau buang di wastafel.`,
          }
        }
        return {
          world: patchItem(world, pipetteId, {
            solution: source.solution,
            ph: source.ph,
          }),
        }
      },
    },
    {
      source: 'pipette',
      target: 'tube',
      run: (world, pipetteId, tubeId) => {
        const pipette = world.items[pipetteId].state
        if (!solutionOf(pipette)) {
          return {
            reject: 'Pipet masih kosong. Ambil larutan dulu dari botol.',
          }
        }
        const filled = filledTubeReject(world.items[tubeId].state)
        if (filled) return filled
        const poured = patchItem(world, tubeId, {
          solution: pipette.solution,
          ph: pipette.ph,
        })
        return { world: patchItem(poured, pipetteId, EMPTY_PIPETTE) }
      },
    },
    {
      source: 'bottle',
      target: 'tube',
      run: (world, bottleId, tubeId) => {
        const filled = filledTubeReject(world.items[tubeId].state)
        if (filled) return filled
        const source = world.items[bottleId].state
        return {
          world: patchItem(world, tubeId, {
            solution: source.solution,
            ph: source.ph,
          }),
        }
      },
    },
    {
      source: 'indicator',
      target: 'tube',
      run: (world, _indicatorId, tubeId) => {
        if (world.items[tubeId].state.indicator) {
          return { reject: 'Tabung ini sudah diberi indikator.' }
        }
        return { world: patchItem(world, tubeId, { indicator: true }) }
      },
    },
    {
      source: 'tube',
      target: 'ph-card',
      run: (world, tubeId) => {
        const tube = world.items[tubeId].state
        const solution = solutionOf(tube)
        if (!solution && !tube.indicator) {
          return { reject: 'Tabung ini masih kosong.' }
        }
        if (!tube.indicator) {
          return {
            reject: 'Teteskan indikator dulu sebelum mencocokkan warna.',
          }
        }
        if (!solution) {
          return { reject: 'Isi tabung dengan larutan dulu.' }
        }
        if (Number(tube.progress) < 1) {
          return { reject: 'Tunggu sampai warnanya berhenti berubah.' }
        }
        const ph = Number(tube.ph)
        const nature = natureOf(ph)
        return {
          world,
          record: {
            larutan: solution.name,
            warna: indicatorColor(ph),
            ph,
            sifat: nature,
          },
          events: [
            { type: 'record-added', lineId: resultLine(String(tube.solution)) },
          ],
          explanation: {
            result: `pH ${ph}, ${solution.inline} bersifat ${nature.toLowerCase()}.`,
            reason: solution.reason,
          },
        }
      },
    },
    {
      source: 'tube',
      target: 'sink',
      run: (world, tubeId) => {
        const tube = world.items[tubeId].state
        if (!tube.solution && !tube.indicator) {
          return { reject: 'Tabung ini sudah kosong.' }
        }
        return { world: patchItem(world, tubeId, EMPTY_TUBE) }
      },
    },
    {
      source: 'pipette',
      target: 'sink',
      run: (world, pipetteId) => {
        if (!world.items[pipetteId].state.solution) {
          return { reject: 'Pipet sudah kosong.' }
        }
        return { world: patchItem(world, pipetteId, EMPTY_PIPETTE) }
      },
    },
  ],

  tick: (world, dt) => {
    let next = world
    const events: LabEvent[] = []
    let explanation: Explanation | undefined
    for (const id of TUBE_IDS) {
      const tube = world.items[id].state
      const solution = solutionOf(tube)
      const before = Number(tube.progress)
      if (!solution || !tube.indicator || before >= 1) continue
      let progress = before + dt / COLOR_CHANGE_SECONDS
      // Absorb float drift, e.g. ten ticks of 0.1 s summing to 0.999…
      if (progress >= 1 - 1e-9) progress = 1
      next = patchItem(next, id, { progress })
      if (progress === 1) {
        const color = indicatorColor(Number(tube.ph)).toLowerCase()
        events.push({ type: 'color-changed', itemId: id, lineId: COLOR_LINE })
        explanation = {
          result: `${solution.name} berubah menjadi ${color}.`,
          reason:
            'Indikator universal adalah campuran pewarna yang warnanya mengikuti tingkat keasaman larutan.',
        }
      }
    }
    return { world: next, events, explanation }
  },

  view: (world) => {
    const out: Record<string, ItemView> = {}
    for (const id of TUBE_IDS) out[id] = tubeView(world.items[id].state)
    out.pipette = pipetteView(world.items.pipette.state)
    return out
  },

  columns: [
    { key: 'larutan', label: 'Larutan' },
    { key: 'warna', label: 'Warna' },
    { key: 'ph', label: 'pH' },
    { key: 'sifat', label: 'Sifat' },
  ],
  prediction: {
    question: 'Menurutmu cuka bersifat asam, basa, atau netral?',
    options: ['Asam', 'Basa', 'Netral'],
  },
  lines: [
    {
      id: COLOR_LINE,
      text: 'Warnanya berubah! Indikator universal adalah campuran pewarna yang warnanya mengikuti tingkat keasaman larutan. Coba cocokkan tabungnya dengan kartu pH.',
    },
    {
      id: resultLine('cuka'),
      text: 'pH 3, cuka bersifat asam karena mengandung banyak ion H⁺ dari asam asetat. Coba uji larutan lain dan bandingkan warnanya.',
    },
    {
      id: resultLine('jeruk'),
      text: 'pH 4, air jeruk bersifat asam karena mengandung asam sitrat. Menurutmu, mana yang lebih asam, cuka atau air jeruk?',
    },
    {
      id: resultLine('suling'),
      text: 'pH 7, air suling bersifat netral karena jumlah ion H⁺ dan OH⁻-nya seimbang. Coba sekarang larutan yang menurutmu basa.',
    },
    {
      id: resultLine('sabun'),
      text: 'pH 10, air sabun bersifat basa karena lebih banyak mengandung ion OH⁻. Itu sebabnya sabun terasa licin di tangan.',
    },
    {
      id: resultLine('naoh'),
      text: 'pH 13, NaOH bersifat basa kuat karena melepaskan banyak ion OH⁻ di air. Lihat tabelmu, larutan mana yang paling asam dan paling basa?',
    },
  ],
  concepts: [
    {
      title: 'Asam dan basa',
      content:
        'Asam adalah zat yang melepaskan ion H⁺ di dalam air, sedangkan basa melepaskan ion OH⁻. Larutan netral memiliki jumlah ion H⁺ dan OH⁻ yang seimbang.',
    },
    {
      title: 'Skala pH',
      content:
        'pH menunjukkan tingkat keasaman larutan pada skala 0–14. pH di bawah 7 berarti asam, pH 7 netral, dan di atas 7 basa. Makin kecil pH, makin asam larutannya.',
      formula: 'pH = −log[H⁺]',
    },
    {
      title: 'Indikator universal',
      content:
        'Indikator universal adalah campuran beberapa pewarna yang warnanya berubah mengikuti pH: merah untuk asam kuat, hijau untuk netral, dan ungu untuk basa kuat.',
    },
  ],
}
