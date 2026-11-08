import type { Experiment } from '../types'

export const reactionRate: Experiment = {
    id: 'laju-reaksi',
    subject: 'kimia',
    title: 'Laju Reaksi',
    topic: 'Reaksi',
    summary: 'Cari tahu pengaruh suhu dan konsentrasi terhadap kecepatan reaksi.',
    description: '',
    previewImage: '/img/lab/laju-reaksi.png',
    objectives: [],
    tips: [],
    items: [],
    zones: [],
    interactions: [],
    view: () => ({}),
    columns: [
        { key: 'suhu', label: 'Suhu (°C)' },
        { key: 'konsentrasi', label: 'Konsentrasi (M)' },
        { key: 'waktu', label: 'Waktu (s)' },
        { key: 'laju', label: 'Laju relatif (1/t)' }
    ],
    prediction: {
        question: 'Kalau suhunya dinaikkan, reaksinya jadi lebih cepat atau lebih lambat?',
        options: ['Lebih cepat', 'Lebih lambat', 'Tidak berubah'],
    },
    lines: [],
    concepts: [],
}