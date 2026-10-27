import type { Experiment } from '../data/types'

const PH: Record<string, number> = {
  cuka: 3,
  'air-jeruk': 4,
  'air-suling': 7,
  'air-sabun': 10,
  naoh: 13,
}

export const sampleK1: Experiment = {
  id: 'uji-asam-basa',
  title: 'Uji Asam dan Basa',
  subject: 'kimia',
  topic: 'asam-basa',
  summary: 'Data pengujian',
  description: '',
  previewImage: '/img/cairan.jpg',
  objectives: [],
  materials: [],
  tips: [],
  concepts: [],
  observationColumns: ['larutan', 'pH', 'sifat'],
  steps: [
    {
      id: 'l1',
      instruction: 'Letakkan tabung reaksi di rak.',
      correctAction: 'tube->rack',
      explanation: 'Tabung harus tegak agar larutan tidak tumpah.',
    },
    {
      id: 'l2',
      instruction: 'Tuang larutan ke tabung.',
      correctAction: 'solution->tube',
      explanation: 'Setiap larutan diuji satu per satu.',
    },
    {
      id: 'l3',
      instruction: 'Teteskan indikator universal.',
      correctAction: 'indicator->tube',
      explanation: 'Indikator berubah warna sesuai tingkat keasaman.',
      compute: true,
      repeatFrom: 'l2',
    },
  ],
  rule: (input) => {
    const ph = PH[String(input.solution)] ?? 7
    const nature = ph < 7 ? 'asam' : ph === 7 ? 'netral' : 'basa'
    return {
      values: { larutan: String(input.solution), pH: ph, sifat: nature },
      explanation: `pH ${ph} berarti larutan bersifat ${nature}.`,
    }
  },
}
