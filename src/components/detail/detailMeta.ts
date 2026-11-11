import type { Subject } from '../catalog/experimentMeta'

export const LAB_NAME: Record<Subject, string> = {
  kimia: 'Laboratorium Kimia',
  fisika: 'Laboratorium Fisika',
}

export type DetailExtra = { materials: string[]; steps: string[] }

export const DETAIL_EXTRA: Record<string, DetailExtra> = {
  'uji-asam-basa': {
    materials: [
      'Tabung reaksi',
      'Indikator universal',
      'Pipet tetes',
      'Skala pH',
      'Larutan uji',
    ],
    steps: [
      'Pilih larutan yang ingin diuji',
      'Teteskan indikator ke tabung reaksi',
      'Amati perubahan warnanya',
      'Catat nilai pH di tabel hasil',
    ],
  },
}