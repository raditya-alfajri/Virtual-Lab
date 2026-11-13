import { SHELF } from '../../lib/engine'
import type {
  Experiment,
  Explanation,
  GuideStep,
  Interaction,
  ItemState,
  ItemView,
  LabEvent,
  Outcome,
  Result,
  Row,
  World,
} from '../types'

export const ROOM_TEMP = 25
export const MAX_TEMP = 55
/** TODO(cek guru): how fast the flask warms up in the bath, in °C per second. */
export const HEATING_RATE = 0.5

const BASE_TIME = 60
const BASE_CONC = 0.2
const THERMOMETER_SCALE = 60

const CLEAR_COLOR = '#eef5f8'
/** TODO(cek guru): colour of the flask once the sulphur hides the cross. */
const CLOUDY_COLOR = '#e6d27a'

const FLASK = 'flask'
const BATH = 'bath'
const PAPER = 'paper'
const BENCH = 'bench'

const HEATER_LINE = 'k3-heater-on'
const REACTION_LINE = 'k3-reaction-started'
const CROSS_LINE = 'k3-cross-gone'

const MOVE_REJECT = 'Biarkan labu di atas kertas silang sampai reaksi selesai.'

const THIO_BOTTLES = [
  { id: 'thio-005', conc: 0.05 },
  { id: 'thio-010', conc: 0.1 },
  { id: 'thio-015', conc: 0.15 },
  { id: 'thio-020', conc: 0.2 },
]

const EMPTY_FLASK: ItemState = {
  conc: 0,
  temp: ROOM_TEMP,
  hcl: false,
  lockedTemp: 0,
  reactionTime: 0,
  elapsed: 0,
}

type Flask = {
  conc: number
  temp: number
  hcl: boolean
  lockedTemp: number
  reactionTime: number
  /** Seconds since HCl was poured. */
  elapsed: number
}

function readFlask(world: World): Flask {
  const s = world.items[FLASK].state
  return {
    conc: Number(s.conc),
    temp: Number(s.temp),
    hcl: s.hcl === true,
    lockedTemp: Number(s.lockedTemp),
    reactionTime: Number(s.reactionTime),
    elapsed: Number(s.elapsed),
  }
}

const isReacting = (f: Flask) => f.hcl && f.elapsed < f.reactionTime
const progressOf = (f: Flask) =>
  f.hcl ? Math.min(1, f.elapsed / f.reactionTime) : 0

/** t = 60 × (0,2 ÷ C) × 2^(−(T − 25) ÷ 10) */
export function reactionTime(conc: number, temp: number): number {
  return BASE_TIME * (BASE_CONC / conc) * 2 ** (-(temp - ROOM_TEMP) / 10)
}

// The epsilon makes halves round up; toFixed alone can round them down
// because of float error.
function formatDecimal(value: number, digits: number): string {
  const factor = 10 ** digits
  const rounded = Math.round(value * factor + 1e-9) / factor
  return rounded.toFixed(digits).replace('.', ',')
}

const formatConc = (conc: number) => formatDecimal(conc, 2)

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

function moveItem(world: World, id: string, at: string): World {
  return {
    ...world,
    items: { ...world.items, [id]: { ...world.items[id], at } },
  }
}

function moveFlask(world: World, at: string): Result {
  if (world.items[FLASK].at === at) return { world }
  if (isReacting(readFlask(world))) return { reject: MOVE_REJECT }
  return { world: moveItem(world, FLASK, at) }
}

function pourHcl(world: World): Result {
  const flask = readFlask(world)
  if (!flask.conc) return { reject: 'Isi labu dengan Na₂S₂O₃ dulu.' }
  if (flask.hcl) {
    return {
      reject: 'Labu ini sudah diberi HCl. Bersihkan labu untuk percobaan baru.',
    }
  }
  if (world.items[FLASK].at !== PAPER) {
    return { reject: 'Letakkan labu di atas kertas silang dulu.' }
  }
  if (world.items.thermometer.at !== FLASK) {
    return { reject: 'Pasang termometer di labu dulu.' }
  }
  if (world.items.stopwatch.state.running !== true) {
    return { reject: 'Jalankan stopwatch dulu.' }
  }

  const lockedTemp = Math.round(flask.temp)
  const poured = patchItem(world, FLASK, {
    hcl: true,
    lockedTemp,
    reactionTime: reactionTime(flask.conc, lockedTemp),
    elapsed: 0,
  })
  return {
    world: patchItem(poured, 'stopwatch', { elapsed: 0 }),
    events: [
      { type: 'reaction-started', itemId: FLASK, lineId: REACTION_LINE },
    ],
    explanation: {
      result: `Reaksi dimulai pada suhu ${lockedTemp} °C.`,
      reason:
        'Na₂S₂O₃ bereaksi dengan HCl membentuk endapan belerang yang membuat larutan makin keruh.',
      formula: 'Na₂S₂O₃ + 2HCl → 2NaCl + S + SO₂ + H₂O',
    },
  }
}

const interactions: Interaction[] = [
  {
    source: 'thio',
    target: FLASK,
    run: (world, bottleId) => {
      const flask = readFlask(world)
      if (flask.conc) {
        return {
          reject: `Labu sudah berisi Na₂S₂O₃ ${formatConc(flask.conc)} M. Satu labu untuk satu percobaan.`,
        }
      }
      return {
        world: patchItem(world, FLASK, {
          conc: world.items[bottleId].state.conc,
        }),
      }
    },
  },
  {
    source: 'hcl',
    target: FLASK,
    run: (world) => pourHcl(world),
  },
  {
    source: 'thermometer',
    target: FLASK,
    run: (world, thermometerId) => ({
      world: moveItem(world, thermometerId, FLASK),
    }),
  },
  // Bench and shelf need rules too: otherwise the engine moves the flask
  // itself, even off the cross paper mid-reaction.
  ...[BATH, PAPER, BENCH, SHELF].map((target): Interaction => ({
    source: FLASK,
    target,
    run: (world) => moveFlask(world, target),
  })),
]

function crossGone(world: World, flask: Flask): Outcome {
  const time = formatDecimal(flask.reactionTime, 1)
  const rate = formatDecimal(1 / flask.reactionTime, 4)
  const record: Row = {
    suhu: flask.lockedTemp,
    konsentrasi: formatConc(flask.conc),
    waktu: time,
    laju: rate,
  }
  const explanation: Explanation = {
    result: `Tanda silang hilang setelah ${time} detik.`,
    reason:
      'Endapan belerang sudah cukup banyak untuk menutupi tanda silang. Makin singkat waktunya, makin cepat reaksinya.',
    formula: `laju relatif = 1 ÷ t = 1 ÷ ${time} = ${rate}`,
  }
  return {
    world,
    record,
    events: [{ type: 'record-added', itemId: PAPER, lineId: CROSS_LINE }],
    explanation,
    duplicateNote: {
      result: 'Data ini sudah ada di tabel.',
      reason:
        'Coba suhu atau konsentrasi lain supaya hasilnya bisa dibandingkan.',
    },
  }
}

function tick(world: World, dt: number): Outcome {
  const flask = readFlask(world)
  const stopwatch = world.items.stopwatch.state
  const running = stopwatch.running === true
  let explanation: Explanation | undefined

  let temp = flask.temp
  const heating =
    world.items[BATH].state.on === true && world.items[FLASK].at === BATH
  if (heating && temp < MAX_TEMP) {
    temp = Math.min(MAX_TEMP, temp + HEATING_RATE * dt)
    if (temp === MAX_TEMP) {
      explanation = {
        result: `Suhu labu mencapai ${MAX_TEMP} °C.`,
        reason:
          'Ini batas suhu penangas di praktikum ini, jadi suhunya berhenti naik.',
      }
    }
  }

  let next = world
  if (temp !== flask.temp) next = patchItem(next, FLASK, { temp })
  if (running) {
    next = patchItem(next, 'stopwatch', {
      elapsed: Number(stopwatch.elapsed) + dt,
    })
  }
  if (!isReacting(flask)) return { world: next, explanation }

  let elapsed = flask.elapsed + dt
  // Absorb float drift, e.g. many 0.1 s frames summing to 59.999…
  if (elapsed < flask.reactionTime - 1e-9) {
    return { world: patchItem(next, FLASK, { elapsed }), explanation }
  }
  elapsed = flask.reactionTime
  next = patchItem(next, FLASK, { elapsed })
  next = patchItem(next, 'stopwatch', { running: false, elapsed })
  return crossGone(next, { ...flask, elapsed })
}

const use: Experiment['use'] = {
  [BATH]: (world, bathId) => {
    const on = world.items[bathId].state.on !== true
    const events: LabEvent[] = on
      ? [{ type: 'heater-on', itemId: bathId, lineId: HEATER_LINE }]
      : []
    return {
      world: patchItem(world, bathId, { on }),
      events,
      explanation: on
        ? {
            result: 'Pemanas menyala.',
            reason:
              'Panas dari air penangas berpindah ke larutan di dalam labu, jadi suhunya naik.',
          }
        : undefined,
    }
  },
  stopwatch: (world, stopwatchId) => {
    const running = world.items[stopwatchId].state.running === true
    if (running && isReacting(readFlask(world))) {
      return {
        reject: 'Biarkan stopwatch berjalan sampai tanda silang hilang.',
      }
    }
    return {
      world: patchItem(
        world,
        stopwatchId,
        running ? { running: false } : { running: true, elapsed: 0 },
      ),
    }
  },
  [FLASK]: (world) => {
    const flask = readFlask(world)
    if (isReacting(flask)) return { reject: 'Tunggu sampai reaksi selesai.' }
    if (!flask.conc) return { reject: 'Labu sudah kosong.' }
    return { world: patchItem(world, FLASK, EMPTY_FLASK) }
  },
}

function guide(world: World, rows: Row[]): GuideStep | null {
  const flask = readFlask(world)
  const at = world.items[FLASK].at
  if (isReacting(flask)) {
    return { text: 'Perhatikan tanda silang di bawah labu sampai hilang.' }
  }
  if (flask.hcl) {
    return {
      text: 'Ketuk labu untuk membersihkannya, lalu coba suhu atau konsentrasi lain.',
      target: FLASK,
    }
  }
  if (!flask.conc) {
    return { text: 'Tuang Na₂S₂O₃ ke dalam labu.', target: 'thio-020' }
  }
  if (world.items.thermometer.at !== FLASK) {
    return { text: 'Pasang termometer di labu.', target: 'thermometer' }
  }
  const heaterOn = world.items[BATH].state.on === true
  const recorded = rows.some(
    (row) =>
      row.suhu === Math.round(flask.temp) &&
      row.konsentrasi === formatConc(flask.conc),
  )
  if (recorded) {
    if (at !== BATH) {
      return {
        text: 'Suhu ini sudah tercatat. Taruh labu di penangas air untuk memanaskannya.',
        target: FLASK,
      }
    }
    return heaterOn
      ? { text: 'Tunggu suhunya naik dulu.', target: 'thermometer' }
      : { text: 'Ketuk penangas air untuk menyalakan pemanas.', target: BATH }
  }
  if (at !== PAPER) {
    return {
      text:
        at === BATH && heaterOn
          ? 'Kalau suhunya sudah cukup, pindahkan labu ke kertas silang.'
          : 'Pindahkan labu ke atas kertas silang.',
      target: FLASK,
    }
  }
  if (world.items.stopwatch.state.running !== true) {
    return {
      text: 'Ketuk stopwatch untuk menjalankannya.',
      target: 'stopwatch',
    }
  }
  return { text: 'Sekarang tuang HCl ke labu!', target: 'hcl' }
}

function flaskView(flask: Flask): ItemView {
  if (!flask.conc) return { label: 'Kosong', level: 0 }
  const reacting = isReacting(flask)
  let label = `Na₂S₂O₃ ${formatConc(flask.conc)} M`
  if (reacting) label = 'Sedang bereaksi'
  else if (flask.hcl) label = 'Reaksi selesai'
  return {
    label,
    color: mixHex(CLEAR_COLOR, CLOUDY_COLOR, progressOf(flask)),
    level: flask.hcl ? 0.6 : 0.5,
    action: reacting ? undefined : 'Bersihkan',
  }
}

export const reactionRate: Experiment = {
  id: 'laju-reaksi',
  subject: 'kimia',
  title: 'Laju Reaksi',
  topic: 'Reaksi',
  summary: 'Cari tahu pengaruh suhu dan konsentrasi terhadap kecepatan reaksi.',
  description:
    'Di praktikum ini kamu mereaksikan natrium tiosulfat (Na₂S₂O₃) dengan asam klorida (HCl). Reaksinya menghasilkan endapan belerang yang membuat larutan keruh sampai tanda silang di bawah labu tidak terlihat. Ukur waktunya dengan stopwatch, lalu ulangi dengan suhu dan konsentrasi yang berbeda untuk melihat mana yang membuat reaksi lebih cepat.',
  previewImage: '/img/lab/laju-reaksi.png',
  objectives: [
    'Mengukur waktu reaksi Na₂S₂O₃ dengan HCl memakai metode tanda silang.',
    'Menyelidiki pengaruh suhu terhadap laju reaksi.',
    'Menyelidiki pengaruh konsentrasi terhadap laju reaksi.',
  ],
  tips: [
    'Pasang termometer di labu, lalu panaskan labu di penangas sampai suhu yang kamu inginkan.',
    'Pindahkan labu ke kertas silang dan jalankan stopwatch sebelum menuang HCl.',
    'Suhu yang dicatat adalah suhu saat HCl dituang, dibulatkan ke derajat terdekat.',
    'Ketuk labu untuk membersihkannya setelah reaksi selesai, lalu mulai percobaan berikutnya.',
    'Ubah satu hal saja di setiap percobaan, suhu atau konsentrasi, supaya hasilnya mudah dibandingkan.',
  ],

  items: [
    {
      id: FLASK,
      kind: FLASK,
      name: 'Labu Erlenmeyer',
      start: BENCH,
      state: EMPTY_FLASK,
    },
    ...THIO_BOTTLES.map(({ id, conc }) => ({
      id,
      kind: 'thio',
      name: `Na₂S₂O₃ ${formatConc(conc)} M`,
      state: { conc },
    })),
    { id: 'hcl', kind: 'hcl', name: 'HCl' },
    {
      id: 'thermometer',
      kind: 'thermometer',
      name: 'Termometer',
      start: BENCH,
    },
    {
      id: 'stopwatch',
      kind: 'stopwatch',
      name: 'Stopwatch',
      start: BENCH,
      state: { running: false, elapsed: 0 },
    },
    {
      id: BATH,
      kind: BATH,
      name: 'Penangas air',
      fixed: true,
      start: BENCH,
      state: { on: false },
    },
    {
      id: PAPER,
      kind: PAPER,
      name: 'Kertas bertanda silang',
      fixed: true,
      start: BENCH,
    },
  ],
  zones: [
    {
      id: BENCH,
      name: 'Meja kerja',
      accepts: [FLASK, 'thermometer', 'stopwatch'],
    },
  ],
  interactions,
  use,
  tick,
  guide,

  view: (world) => {
    const flask = readFlask(world)
    const stopwatch = world.items.stopwatch.state
    const running = stopwatch.running === true
    const bathOn = world.items[BATH].state.on === true
    const temp = world.items.thermometer.at === FLASK ? flask.temp : ROOM_TEMP
    const out: Record<string, ItemView> = {
      [FLASK]: flaskView(flask),
      thermometer: {
        reading: `${Math.round(temp)} °C`,
        level: temp / THERMOMETER_SCALE,
      },
      stopwatch: {
        reading: `${formatDecimal(Number(stopwatch.elapsed), 1)} s`,
        active: running,
        action: running
          ? isReacting(flask)
            ? undefined
            : 'Berhenti'
          : 'Mulai',
      },
      [BATH]: {
        label: bathOn ? 'Pemanas menyala' : 'Pemanas mati',
        active: bathOn,
        action: bathOn ? 'Matikan' : 'Nyalakan',
      },
      [PAPER]: {
        visibility: world.items[FLASK].at === PAPER ? 1 - progressOf(flask) : 1,
      },
    }
    for (const { id, conc } of THIO_BOTTLES) {
      out[id] = { label: `${formatConc(conc)} M` }
    }
    return out
  },

  columns: [
    { key: 'suhu', label: 'Suhu (°C)' },
    { key: 'konsentrasi', label: 'Konsentrasi (M)' },
    { key: 'waktu', label: 'Waktu (s)' },
    { key: 'laju', label: 'Laju relatif (1/t)' },
  ],
  prediction: {
    question:
      'Kalau suhunya dinaikkan, reaksinya jadi lebih cepat atau lebih lambat?',
    options: ['Lebih cepat', 'Lebih lambat', 'Tidak berubah'],
  },
  lines: [
    {
      id: HEATER_LINE,
      text: 'Pemanas menyala. Panas dari air penangas berpindah ke larutan, jadi partikelnya bergerak makin cepat. Matikan pemanas saat suhunya sesuai tujuanmu.',
    },
    {
      id: REACTION_LINE,
      text: 'Reaksi dimulai! Na₂S₂O₃ bereaksi dengan HCl membentuk endapan belerang yang membuat larutan keruh. Perhatikan tanda silang di bawah labu.',
    },
    {
      id: CROSS_LINE,
      text: 'Tanda silangnya hilang karena endapan belerang sudah cukup banyak menutupi pandangan. Waktunya tercatat. Coba ulangi dengan suhu atau konsentrasi berbeda.',
    },
  ],
  concepts: [
    {
      title: 'Laju reaksi',
      content:
        'Laju reaksi menyatakan seberapa cepat pereaksi berubah menjadi hasil reaksi. Di praktikum ini, laju diukur dari waktu yang dibutuhkan endapan belerang untuk menutupi tanda silang. Makin singkat waktunya, makin besar lajunya.',
      formula: 'laju relatif = 1 ÷ t',
    },
    {
      title: 'Pengaruh suhu',
      content:
        'Saat suhu naik, partikel bergerak lebih cepat dan lebih sering bertumbukan dengan energi yang cukup untuk bereaksi. Akibatnya reaksi berlangsung lebih cepat. Sebagai patokan kasar, banyak reaksi menjadi sekitar dua kali lebih cepat setiap suhu naik 10 °C.',
    },
    {
      title: 'Pengaruh konsentrasi',
      content:
        'Konsentrasi yang lebih besar berarti ada lebih banyak partikel pereaksi dalam volume yang sama. Partikel jadi lebih sering bertumbukan, sehingga reaksi berlangsung lebih cepat.',
    },
  ],
}
