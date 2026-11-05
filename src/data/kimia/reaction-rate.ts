import type { Experiment, ItemDef, Result, World } from '../types'
import {
  SHELF,
  STOPWATCH_STATE,
  bool,
  fmt,
  mixColor,
  moveTo,
  num,
  ok,
  pressStopwatch,
  reject,
  round,
  stopwatchView,
  tickStopwatch,
  update,
} from '../instruments'

// Nilai dari PRD bagian 7 (K3).
export const BASE_TIME = 60 // s, t₀
export const BASE_CONC = 0.2 // M, C₀
export const BASE_TEMP = 25 // °C, T₀ dan suhu ruang
export const MAX_TEMP = 55 // °C
// TODO(cek guru): laju kenaikan suhu penangas tidak ada di PRD. 0,5 °C/s:
// 25 → 55 °C dalam 60 s (12 s pada kecepatan 5×). Labu tidak mendingin sendiri.
export const HEAT_RATE = 0.5 // °C/s

// Rumus K3: waktu sampai tanda silang hilang dan laju relatif.
export const reactionTime = (conc: number, temp: number) =>
  BASE_TIME * (BASE_CONC / conc) * 2 ** (-(temp - BASE_TEMP) / 10)
export const relativeRate = (t: number) => 1 / t

const BENCH = 'bench'
const FLASK = 'flask'
const PAPER = 'paper'
const BATH = 'bath'
const THERMOMETER = 'thermometer'
const STOPWATCH = 'stopwatch'

const BOTTLES = [0.05, 0.1, 0.15, 0.2].map((conc) => ({
  id: `thio-${String(Math.round(conc * 100)).padStart(3, '0')}`,
  conc,
}))
const concOf = (id: string) => BOTTLES.find((b) => b.id === id)!.conc

// TODO(cek guru): warna larutan bening dan keruh karena endapan belerang.
const CLEAR_COLOR = '#EEF6FB'
const CLOUDY_COLOR = '#EFE6C2'

const EMPTY_FLASK = {
  conc: 0,
  temp: BASE_TEMP,
  acid: false,
  reactionTemp: 0,
  duration: 0,
  elapsed: 0,
  done: false,
}

// Angka tanpa nol berlebih untuk siswa: show(0.05, 2) → '0,05'.
const show = (x: number, decimals: number) =>
  String(round(x, decimals)).replace('.', ',')

const conc = (w: World) => num(w, FLASK, 'conc')
const reacting = (w: World) => bool(w, FLASK, 'acid') && !bool(w, FLASK, 'done')
const heating = (w: World) =>
  bool(w, BATH, 'on') &&
  w.items[FLASK].at === BATH &&
  conc(w) > 0 &&
  !bool(w, FLASK, 'acid') &&
  num(w, FLASK, 'temp') < MAX_TEMP
const progress = (w: World) => {
  const duration = num(w, FLASK, 'duration')
  return duration ? num(w, FLASK, 'elapsed') / duration : 0
}

const REASON =
  'Reaksi terjadi saat partikel Na₂S₂O₃ dan HCl bertumbukan. Konsentrasi lebih besar berarti lebih banyak partikel sehingga tumbukan lebih sering. Suhu lebih tinggi membuat partikel bergerak lebih cepat sehingga tumbukan yang berhasil makin banyak. Pada percobaan ini, setiap kenaikan suhu 10 °C membuat waktu reaksi menjadi setengahnya.'
const FORMULA = 't = t₀ × (C₀ ÷ C) × 2^(−(T − T₀) ÷ 10)'

function pourAcid(w: World): Result {
  if (!conc(w)) {
    return reject(
      'HCl tanpa Na₂S₂O₃ tidak bereaksi. Tuang larutan Na₂S₂O₃ ke labu dulu.',
    )
  }
  if (bool(w, FLASK, 'done')) {
    return reject(
      'Reaksi di labu ini sudah selesai. Kembalikan labu ke rak untuk mencucinya.',
    )
  }
  if (reacting(w)) {
    return reject('HCl sudah dituang. Tunggu sampai tanda silang hilang.')
  }
  if (w.items[FLASK].at !== PAPER) {
    return reject(
      'Taruh labu di atas kertas bertanda silang dulu agar kamu bisa melihat kapan tanda silangnya hilang.',
    )
  }
  if (w.items[THERMOMETER].at !== FLASK) {
    return reject('Pasang termometer di labu dulu agar suhunya terbaca.')
  }
  if (!bool(w, STOPWATCH, 'running')) {
    return reject('Jalankan stopwatch dulu sebelum menuang HCl.')
  }
  // Suhu dikunci saat HCl dituang dan dibulatkan seperti bacaan termometer.
  const temp = Math.round(num(w, FLASK, 'temp'))
  const next = update(w, FLASK, {
    acid: true,
    reactionTemp: temp,
    duration: reactionTime(conc(w), temp),
    elapsed: 0,
  })
  // Stopwatch dihitung dari saat HCl dituang agar sama dengan waktu reaksi.
  return ok(update(next, STOPWATCH, { elapsed: 0 }))
}

function measure(w: World): Result {
  const temp = num(w, FLASK, 'reactionTemp')
  const c = conc(w)
  const t = num(w, FLASK, 'duration')
  const rate = relativeRate(t)
  return ok(w, {
    record: {
      suhu: temp,
      konsentrasi: c,
      waktu: round(t, 1),
      laju: round(rate, 4),
    },
    explanation: {
      result: `Na₂S₂O₃ ${show(c, 2)} M pada ${temp} °C: tanda silang hilang setelah ${show(t, 1)} s, jadi laju relatif 1/t = ${show(rate, 4)} s⁻¹.`,
      reason: REASON,
      formula: FORMULA,
    },
  })
}

function flaskLabel(w: World): string {
  if (!conc(w)) return 'Kosong'
  if (bool(w, FLASK, 'done')) return 'Keruh · tanda silang hilang'
  if (reacting(w)) return 'Makin keruh…'
  return `Na₂S₂O₃ ${show(conc(w), 2)} M`
}

const items: ItemDef[] = [
  { id: FLASK, kind: 'flask', name: 'Labu Erlenmeyer', state: EMPTY_FLASK },
  {
    id: PAPER,
    kind: 'paper',
    name: 'Kertas bertanda silang',
    start: BENCH,
    fixed: true,
  },
  {
    id: BATH,
    kind: 'bath',
    name: 'Penangas air',
    start: BENCH,
    fixed: true,
    state: { on: false },
  },
  ...BOTTLES.map((b) => ({
    id: b.id,
    kind: 'thiosulfate',
    name: `Na₂S₂O₃ ${show(b.conc, 2)} M`,
    props: { conc: b.conc },
  })),
  { id: 'hcl', kind: 'hcl', name: 'HCl' },
  { id: THERMOMETER, kind: 'thermometer', name: 'Termometer' },
  {
    id: STOPWATCH,
    kind: 'stopwatch',
    name: 'Stopwatch',
    state: STOPWATCH_STATE,
  },
]

export const reactionRate: Experiment = {
  id: 'laju-reaksi',
  title: 'Laju Reaksi',
  subject: 'kimia',
  topic: 'Reaksi',
  summary:
    'Campurkan Na₂S₂O₃ dan HCl, lalu ukur berapa lama tanda silang menghilang pada suhu dan konsentrasi berbeda.',
  description:
    'Kenapa makanan lebih cepat basi di tempat panas? Suhu dan konsentrasi memengaruhi cepat lambatnya reaksi. Di eksperimen ini kamu memanaskan larutan Na₂S₂O₃, menuangkan HCl, lalu mengukur waktu sampai endapan belerang menutupi tanda silang di bawah labu.',
  previewImage: '/img/laju-reaksi.webp',
  objectives: [
    'Menyelidiki pengaruh konsentrasi terhadap laju reaksi.',
    'Menyelidiki pengaruh suhu terhadap laju reaksi.',
  ],
  tips: [
    'Pasang termometer di labu dan jalankan stopwatch sebelum menuang HCl.',
    'Ubah satu variabel saja dalam satu kali percobaan: suhu atau konsentrasi.',
    'Kembalikan labu ke rak untuk mencucinya sebelum mencoba larutan lain. Suhunya kembali ke 25 °C.',
    'Pakai kecepatan 5× kalau reaksinya lama.',
  ],
  concepts: [
    {
      title: 'Reaksi natrium tiosulfat dan HCl',
      content:
        'Na₂S₂O₃ bereaksi dengan HCl menghasilkan endapan belerang (S) yang membuat larutan keruh. Waktu sampai tanda silang tidak terlihat menunjukkan cepat lambatnya reaksi.',
      formula: 'Na₂S₂O₃ + 2HCl → 2NaCl + S + SO₂ + H₂O',
    },
    {
      title: 'Laju reaksi',
      content:
        'Makin singkat waktu reaksi, makin cepat reaksinya. Laju relatif dihitung sebagai 1 dibagi waktu.',
      formula: 'laju relatif = 1 ÷ t',
    },
    {
      title: 'Pengaruh konsentrasi dan suhu',
      content:
        'Waktu reaksi berbanding terbalik dengan konsentrasi dan menjadi setengahnya setiap suhu naik 10 °C, dengan t₀ = 60 s pada C₀ = 0,2 M dan T₀ = 25 °C.',
      formula: FORMULA,
    },
  ],
  observationColumns: [
    { key: 'suhu', label: 'Suhu (°C)' },
    { key: 'konsentrasi', label: 'Konsentrasi Na₂S₂O₃ (M)' },
    { key: 'waktu', label: 'Waktu (s)' },
    { key: 'laju', label: 'Laju relatif 1/t (s⁻¹)' },
  ],
  items,
  zones: [
    { id: BENCH, name: 'Meja kerja', accepts: ['flask', 'paper', 'bath'] },
  ],
  interactions: [
    {
      source: 'thiosulfate',
      target: 'flask',
      run: (w, bottle) => {
        if (w.items[FLASK].at === SHELF) {
          return reject('Taruh labu di meja kerja dulu.')
        }
        if (conc(w)) {
          return reject(
            'Satu labu hanya untuk satu larutan. Kembalikan labu ke rak untuk mencucinya dulu.',
          )
        }
        return ok(update(w, FLASK, { conc: concOf(bottle) }))
      },
    },
    { source: 'hcl', target: 'flask', run: (w) => pourAcid(w) },
    {
      source: 'flask',
      target: 'paper',
      run: (w) => ok(moveTo(w, FLASK, PAPER)),
    },
    {
      source: 'flask',
      target: 'bath',
      run: (w) => {
        const next = moveTo(w, FLASK, BATH)
        if (!conc(w) || bool(w, BATH, 'on')) return ok(next)
        return ok(next, { hint: 'Nyalakan pemanas dulu agar suhu naik.' })
      },
    },
    {
      source: 'thermometer',
      target: 'flask',
      run: (w) => ok(moveTo(w, THERMOMETER, FLASK)),
    },
  ],
  use: {
    bath: (w) => {
      if (bool(w, BATH, 'on')) return ok(update(w, BATH, { on: false }))
      if (w.items[FLASK].at === BATH && num(w, FLASK, 'temp') >= MAX_TEMP) {
        return reject(
          `Suhu sudah ${MAX_TEMP} °C, batas tertinggi percobaan ini.`,
        )
      }
      const next = update(w, BATH, { on: true })
      if (heating(next)) return ok(next)
      return ok(next, {
        hint: 'Pemanas menyala. Taruh labu berisi Na₂S₂O₃ di penangas agar suhunya naik.',
      })
    },
    stopwatch: (w, id) => ok(pressStopwatch(w, id)),
  },
  guard: (w, id, target) => {
    if (!reacting(w)) return null
    if ((id === FLASK && target !== SHELF) || id === THERMOMETER) {
      return 'Reaksi sedang berjalan. Biarkan labu dan termometer di atas kertas sampai tanda silang hilang.'
    }
    return null
  },
  tick: (w, dt) => {
    let next = tickStopwatch(w, STOPWATCH, dt)

    if (heating(next)) {
      const temp = Math.min(num(next, FLASK, 'temp') + HEAT_RATE * dt, MAX_TEMP)
      next = update(next, FLASK, { temp })
      if (temp < MAX_TEMP) return ok(next)
      return ok(update(next, BATH, { on: false }), {
        hint: `Suhu sudah ${MAX_TEMP} °C, batas tertinggi percobaan ini. Pemanas dimatikan.`,
      })
    }

    if (!reacting(next)) return ok(next)
    const duration = num(next, FLASK, 'duration')
    const elapsed = Math.min(num(next, FLASK, 'elapsed') + dt, duration)
    next = update(next, FLASK, { elapsed, done: elapsed >= duration })
    if (elapsed < duration) return ok(next)

    if (!bool(next, STOPWATCH, 'running')) {
      return ok(next, {
        hint: 'Tanda silang sudah hilang, tetapi stopwatch tidak berjalan sehingga waktunya tidak tercatat. Kembalikan labu ke rak lalu ulangi.',
      })
    }
    // Stopwatch berhenti tepat saat tanda silang hilang.
    next = update(next, STOPWATCH, { running: false, elapsed: duration })
    return measure(next)
  },
  isActive: (w) => heating(w) || reacting(w) || bool(w, STOPWATCH, 'running'),
  view: (w) => {
    const p = progress(w)
    const onPaper = w.items[FLASK].at === PAPER
    const visibility = onPaper ? round(1 - p, 3) : 1
    const on = bool(w, BATH, 'on')
    const temp = bool(w, FLASK, 'acid')
      ? num(w, FLASK, 'reactionTemp')
      : Math.round(num(w, FLASK, 'temp'))
    return {
      [FLASK]: {
        label: flaskLabel(w),
        color: mixColor(CLEAR_COLOR, CLOUDY_COLOR, p),
        level: conc(w) ? (bool(w, FLASK, 'acid') ? 0.6 : 0.5) : 0,
      },
      [PAPER]: {
        label:
          visibility === 0
            ? 'Tanda silang hilang'
            : visibility < 1
              ? 'Tanda silang memudar…'
              : 'Tanda silang terlihat',
        visibility,
      },
      [BATH]: {
        label: on ? 'Pemanas menyala' : 'Pemanas mati',
        action: on ? 'Matikan' : 'Nyalakan',
      },
      [THERMOMETER]: {
        reading:
          w.items[THERMOMETER].at === FLASK ? `${fmt(temp, 0)} °C` : '– °C',
      },
      [STOPWATCH]: stopwatchView(w, STOPWATCH),
    }
  },
}
