import type { Experiment, World } from '../data/types'
import {
  bool,
  num,
  ok,
  pressStopwatch,
  reject,
  str,
  tickStopwatch,
  update,
} from '../data/instruments'

const TUBES = ['tube-1', 'tube-2']
const PH: Record<string, number> = { acid: 3, base: 13 }

const reacting = (w: World, id: string) =>
  str(w, id, 'solution') !== '' &&
  bool(w, id, 'indicator') &&
  num(w, id, 'progress') < 1

export const sampleK1: Experiment = {
  id: 'uji-asam-basa',
  title: 'Uji Asam & Basa',
  subject: 'kimia',
  topic: 'asam-basa',
  summary: 'Data pengujian',
  description: '',
  previewImage: '/img/cairan.jpg',
  objectives: [],
  tips: [],
  concepts: [],
  observationColumns: [
    { key: 'larutan', label: 'Larutan' },
    { key: 'ph', label: 'pH' },
  ],
  items: [
    ...TUBES.map((id) => ({
      id,
      kind: 'tube',
      name: 'Tabung',
      state: { solution: '', indicator: false, progress: 0 },
    })),
    { id: 'acid', kind: 'solution', name: 'Asam', props: { ph: 3 } },
    { id: 'base', kind: 'solution', name: 'Basa', props: { ph: 13 } },
    { id: 'indicator', kind: 'indicator', name: 'Indikator' },
    {
      id: 'stopwatch',
      kind: 'stopwatch',
      name: 'Stopwatch',
      state: { running: false, elapsed: 0 },
    },
    { id: 'lamp', kind: 'lamp', name: 'Lampu', start: 'bench', fixed: true },
  ],
  zones: [
    { id: 'rack-1', name: 'Rak 1', accepts: ['tube'], capacity: 1 },
    { id: 'rack-2', name: 'Rak 2', accepts: ['tube'], capacity: 1 },
    { id: 'bench', name: 'Meja', accepts: ['tube', 'stopwatch'] },
    { id: 'card', name: 'Kartu pH', accepts: [] },
  ],
  interactions: [
    {
      source: 'solution',
      target: 'tube',
      run: (w, src, tube) =>
        str(w, tube, 'solution') !== ''
          ? reject('Satu tabung hanya untuk satu larutan.')
          : ok(update(w, tube, { solution: src })),
    },
    {
      source: 'indicator',
      target: 'tube',
      run: (w, _src, tube) => ok(update(w, tube, { indicator: true })),
    },
    {
      source: 'tube',
      target: 'card',
      run: (w, tube) => {
        if (!bool(w, tube, 'indicator')) return reject('Belum ada indikator.')
        if (num(w, tube, 'progress') < 1) return reject('Tunggu warnanya.')
        const solution = str(w, tube, 'solution')
        return ok(w, {
          record: { larutan: solution, ph: PH[solution] },
          explanation: { result: `pH ${PH[solution]}`, reason: 'contoh' },
        })
      },
    },
  ],
  use: { stopwatch: (w, id) => ok(pressStopwatch(w, id)) },
  tick: (w, dt) => {
    let next = tickStopwatch(w, 'stopwatch', dt)
    for (const tube of TUBES) {
      if (reacting(next, tube)) {
        const progress = Math.min(num(next, tube, 'progress') + dt, 1)
        next = update(next, tube, { progress })
      }
    }
    return ok(next)
  },
  isActive: (w) =>
    bool(w, 'stopwatch', 'running') || TUBES.some((t) => reacting(w, t)),
  view: (w) =>
    Object.fromEntries(
      TUBES.map((t) => [t, { label: str(w, t, 'solution') || 'Kosong' }]),
    ),
}
