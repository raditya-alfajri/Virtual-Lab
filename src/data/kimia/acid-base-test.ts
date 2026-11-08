import type { Experiment } from '../types'

export const acidBaseTest: Experiment = {
    id: 'uji-asam-basa',
    subject: 'kimia',
    title: 'Uji Asam dan Basa',
    topic: 'Asam & Basa',
    summary:'Uji lima larutan dengan indikator universal untuk mengetahui sifatnya.',
    description: '',
    previewImage: '/images/experiments/kimia/uji-asam-basa.png',
    objectives: [],
    tips: [],
    items: [],
    zones: [],
    interactions: [],
    view: () => ({}),
    columns: [
        { key: 'larutan', label: 'Larutan'},
        { key: 'warna', label: 'Warna'},
        { key: 'ph', label: 'ph'},
        { key: 'sifat', label: 'Sifat'},
    ],
    prediction: {
        question: 'Menurutmu cuka bersifat asam, basa, atau netral?',
        options: ['Asam', 'Basa', 'Netral'],
    },
    lines: [],
    concepts: [],
}