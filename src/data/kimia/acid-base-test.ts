import type { Experiment, ItemDef, World } from '../types'
import { bool, mixColor, num, ok, reject, str, update } from '../instruments'

// Nilai pH dari PRD bagian 7 (K1).
const SOLUTIONS = [
  { id: 'cuka', name: 'Cuka', ph: 3 },
  { id: 'air-jeruk', name: 'Air jeruk', ph: 4 },
  { id: 'air-suling', name: 'Air suling', ph: 7 },
  { id: 'air-sabun', name: 'Air sabun', ph: 10 },
  { id: 'naoh', name: 'NaOH encer', ph: 13 },
]

// TODO(cek guru): nama dan warna indikator universal untuk tiap pH.
const INDICATOR: Record<number, { color: string; name: string }> = {
  3: { color: '#E53935', name: 'merah' },
  4: { color: '#FB8C00', name: 'jingga' },
  7: { color: '#43A047', name: 'hijau' },
  10: { color: '#1E88E5', name: 'biru' },
  13: { color: '#6A1B9A', name: 'ungu' },
}

const LIQUID_COLOR = '#DCEBF5'
const INDICATOR_ONLY_COLOR = '#E2C044'
// Lama perubahan warna (PRD: ≤ 1 detik).
const COLOR_SECONDS = 1
// Jumlah tetes tidak ada di PRD dan tidak memengaruhi pH; hanya untuk tinggi cairan.
const PIPETTE_DROPS = 5
const TUBE_DROPS = 10

const TUBES = ['tube-1', 'tube-2', 'tube-3']
const RACKS = ['rack-1', 'rack-2', 'rack-3']

const solutionName = (id: string) => SOLUTIONS.find((s) => s.id === id)!.name
const phOf = (id: string) => SOLUTIONS.find((s) => s.id === id)!.ph
const natureOf = (ph: number) =>
  ph < 7 ? 'asam' : ph === 7 ? 'netral' : 'basa'

const EMPTY_TUBE = {
  solution: '',
  drops: 0,
  indicator: false,
  progress: 0,
  measured: false,
}
const EMPTY_PIPETTE = { solution: '', drops: 0 }

const REASON: Record<string, string> = {
  asam: 'Larutan asam mengandung lebih banyak ion H⁺ daripada ion OH⁻. Indikator universal berubah ke merah–jingga di larutan asam; makin kecil pH, makin asam.',
  netral:
    'Pada larutan netral jumlah ion H⁺ dan OH⁻ seimbang, sehingga indikator universal berwarna hijau.',
  basa: 'Larutan basa mengandung lebih banyak ion OH⁻ daripada ion H⁺. Indikator universal berubah ke biru–ungu di larutan basa; makin besar pH, makin basa.',
}

const inRack = (w: World, tube: string) => RACKS.includes(w.items[tube].at)

const changing = (w: World, tube: string) =>
  str(w, tube, 'solution') !== '' &&
  bool(w, tube, 'indicator') &&
  num(w, tube, 'progress') < 1

function tubeColor(w: World, tube: string): string {
  const solution = str(w, tube, 'solution')
  if (!bool(w, tube, 'indicator')) return LIQUID_COLOR
  if (!solution) return INDICATOR_ONLY_COLOR
  const target = INDICATOR[phOf(solution)].color
  return mixColor(LIQUID_COLOR, target, num(w, tube, 'progress'))
}

function tubeLabel(w: World, tube: string): string {
  const solution = str(w, tube, 'solution')
  const indicator = bool(w, tube, 'indicator')
  if (!solution) return indicator ? 'Indikator saja' : 'Kosong'
  if (!indicator) return solutionName(solution)
  if (num(w, tube, 'progress') < 1) return 'Warna berubah…'
  const ph = phOf(solution)
  const color = INDICATOR[ph].name
  return bool(w, tube, 'measured') ? `pH ${ph} · ${color}` : color
}

const items: ItemDef[] = [
  ...TUBES.map((id) => ({
    id,
    kind: 'tube',
    name: 'Tabung reaksi',
    state: EMPTY_TUBE,
  })),
  {
    id: 'pipette',
    kind: 'pipette',
    name: 'Pipet tetes',
    state: EMPTY_PIPETTE,
  },
  ...SOLUTIONS.map((s) => ({
    id: s.id,
    kind: 'solution',
    name: s.name,
    props: { ph: s.ph },
  })),
  { id: 'indicator', kind: 'indicator', name: 'Indikator universal' },
]

export const acidBaseTest: Experiment = {
  id: 'uji-asam-basa',
  title: 'Uji Asam & Basa',
  subject: 'kimia',
  topic: 'Asam & basa',
  summary:
    'Bedakan larutan asam, basa, dan netral dari warna indikator universal dan nilai pH-nya.',
  description:
    'Cuka, air jeruk, dan air sabun ada di sekitar kita, tetapi sifatnya berbeda. Di eksperimen ini kamu meneteskan larutan ke tabung reaksi, menambahkan indikator universal, lalu mencocokkan warnanya dengan kartu skala pH.',
  previewImage: '/img/cairan.jpg',
  objectives: [
    'Membedakan larutan asam, basa, dan netral lewat nilai pH.',
    'Membaca nilai pH dengan mencocokkan warna indikator universal ke kartu skala pH.',
  ],
  tips: [
    'Satu tabung hanya untuk satu larutan. Kosongkan tabung di wastafel kalau ingin mencoba larutan lain.',
    'Tunggu warna indikator berhenti berubah sebelum mencocokkannya ke kartu skala pH.',
    'Bandingkan larutan dari dapur (cuka, air jeruk) dengan larutan pembersih (air sabun).',
  ],
  concepts: [
    {
      title: 'Skala pH',
      content:
        'pH menunjukkan tingkat keasaman larutan pada skala 0 sampai 14. Larutan dengan pH di bawah 7 bersifat asam, tepat 7 netral, dan di atas 7 basa.',
      formula: 'pH < 7 asam · pH = 7 netral · pH > 7 basa',
    },
    {
      title: 'Indikator universal',
      content:
        'Indikator universal adalah campuran zat warna yang berubah warna sesuai pH. Warnanya dicocokkan dengan kartu skala pH untuk membaca nilai pH.',
    },
  ],
  observationColumns: [
    { key: 'larutan', label: 'Larutan' },
    { key: 'warna', label: 'Warna indikator' },
    { key: 'ph', label: 'pH' },
    { key: 'sifat', label: 'Sifat' },
  ],
  items,
  zones: [
    ...RACKS.map((id, i) => ({
      id,
      name: `Rak tabung ${i + 1}`,
      accepts: ['tube'],
      capacity: 1,
    })),
    { id: 'ph-card', name: 'Kartu skala pH', accepts: [] },
    { id: 'sink', name: 'Wastafel', accepts: [] },
  ],
  interactions: [
    {
      source: 'pipette',
      target: 'solution',
      run: (w, pipette, bottle) => {
        const held = str(w, pipette, 'solution')
        if (held && held !== bottle && num(w, pipette, 'drops') > 0) {
          return reject(
            `Pipet masih berisi ${solutionName(held)}. Kosongkan di wastafel dulu agar larutan tidak tercampur.`,
          )
        }
        return ok(
          update(w, pipette, { solution: bottle, drops: PIPETTE_DROPS }),
        )
      },
    },
    {
      source: 'pipette',
      target: 'tube',
      run: (w, pipette, tube) => {
        const held = str(w, pipette, 'solution')
        const inside = str(w, tube, 'solution')
        if (!held) {
          return reject('Pipet masih kosong. Isi dulu dari botol larutan.')
        }
        if (!inRack(w, tube)) {
          return reject('Taruh tabung di rak dulu agar tidak tumpah.')
        }
        if (inside && inside !== held) {
          return reject(
            'Satu tabung hanya untuk satu larutan. Kosongkan tabung di wastafel dulu.',
          )
        }
        if (num(w, tube, 'drops') >= TUBE_DROPS) {
          return reject('Tabung sudah penuh.')
        }
        const left = num(w, pipette, 'drops') - 1
        const next = update(w, tube, {
          solution: held,
          drops: num(w, tube, 'drops') + 1,
        })
        return ok(
          update(next, pipette, left > 0 ? { drops: left } : EMPTY_PIPETTE),
        )
      },
    },
    {
      source: 'solution',
      target: 'tube',
      run: () =>
        reject('Pakai pipet tetes untuk memindahkan larutan ke tabung.'),
    },
    {
      source: 'indicator',
      target: 'tube',
      run: (w, _indicator, tube) => {
        if (!inRack(w, tube)) {
          return reject('Taruh tabung di rak dulu agar tidak tumpah.')
        }
        if (bool(w, tube, 'indicator')) {
          return reject('Tabung ini sudah diberi indikator.')
        }
        return ok(update(w, tube, { indicator: true }))
      },
    },
    {
      source: 'tube',
      target: 'ph-card',
      run: (w, tube) => {
        const solution = str(w, tube, 'solution')
        if (!solution) return reject('Tabung ini belum berisi larutan.')
        if (!bool(w, tube, 'indicator')) {
          return reject(
            'Teteskan indikator universal dulu agar warnanya bisa dicocokkan dengan kartu.',
          )
        }
        if (num(w, tube, 'progress') < 1) {
          return reject('Tunggu sampai warna indikator berhenti berubah.')
        }
        const ph = phOf(solution)
        const nature = natureOf(ph)
        const name = solutionName(solution)
        return ok(update(w, tube, { measured: true }), {
          record: {
            larutan: name,
            warna: INDICATOR[ph].name,
            ph,
            sifat: nature,
          },
          explanation: {
            result: `${name} membuat indikator berwarna ${INDICATOR[ph].name}, sesuai pH ${ph}. Jadi ${name.toLowerCase()} bersifat ${nature}.`,
            reason: REASON[nature],
            formula: 'pH < 7 asam · pH = 7 netral · pH > 7 basa',
          },
        })
      },
    },
    {
      source: 'tube',
      target: 'sink',
      run: (w, tube) => ok(update(w, tube, EMPTY_TUBE)),
    },
    {
      source: 'pipette',
      target: 'sink',
      run: (w, pipette) => ok(update(w, pipette, EMPTY_PIPETTE)),
    },
  ],
  tick: (w, dt) => {
    let next = w
    for (const tube of TUBES) {
      if (!changing(next, tube)) continue
      const progress = num(next, tube, 'progress') + dt / COLOR_SECONDS
      next = update(next, tube, { progress: Math.min(progress, 1) })
    }
    return ok(next)
  },
  isActive: (w) => TUBES.some((tube) => changing(w, tube)),
  view: (w) => {
    const view: Record<string, Record<string, string | number>> = {}
    for (const tube of TUBES) {
      view[tube] = {
        label: tubeLabel(w, tube),
        color: tubeColor(w, tube),
        level: num(w, tube, 'drops') / TUBE_DROPS,
      }
    }
    const held = str(w, 'pipette', 'solution')
    view.pipette = held
      ? {
          label: `${solutionName(held)} · ${num(w, 'pipette', 'drops')} tetes`,
          color: LIQUID_COLOR,
          level: num(w, 'pipette', 'drops') / PIPETTE_DROPS,
        }
      : { label: 'Kosong', level: 0 }
    return view
  },
}
