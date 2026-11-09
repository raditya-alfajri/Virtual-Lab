import type { Experiment } from '../types'

export const solutionConcentration: Experiment = {
  id: 'konsentrasi-larutan',
  subject: 'kimia',
  title: 'Konsentrasi Larutan',
  topic: 'Larutan',
  summary: 'Buat larutan CuSO₄, hitung konsentrasinya, lalu coba pengenceran.',
  description: '',
  previewImage: '/img/lab/konsentrasi-larutan.webp',
  objectives: [],
  tips: [],
  items: [],
  zones: [],
  interactions: [],
  view: () => ({}),
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
  lines: [],
  concepts: [],
}
