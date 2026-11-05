import type { Offset, Rect, SceneLayout } from '../types'

// Koordinat panggung 1440 × 1024.
export const STAGE = { width: 1440, height: 1024 }

// Neraca digital sudah tergambar di background (layarnya kosong).
export const BACKGROUND = '/img/lab/konsentrasi-larutan-bg.svg'

export const HOME: Record<string, Rect> = {
  cuso4: { x: 120, y: 170, w: 100, h: 130 },
  water: { x: 300, y: 130, w: 110, h: 170 },
  beaker: { x: 660, y: 540, w: 144, h: 161 },
  cylinder: { x: 840, y: 500, w: 64, h: 200 },
  'watch-glass': { x: 950, y: 620, w: 150, h: 80 },
  'spoon-small': { x: 1140, y: 608, w: 128, h: 40 },
  'spoon-large': { x: 1140, y: 648, w: 160, h: 50 },
  // Batang pengaduk digambar rebah horizontal.
  stirrer: { x: 1150, y: 702, w: 180, h: 24 },
}

export const ZONES: Record<string, Rect> = {
  // Posisi kaca arloji di atas piringan neraca.
  balance: { x: 175, y: 392, w: 150, h: 80 },
  bench: { x: 600, y: 550, w: 840, h: 200 },
}

// Batang pengaduk berdiri miring di gelas kimia: ujung atas di kiri atas
// bibir gelas, ujung bawah dekat dasar gelas.
export const ATTACH: Record<string, Record<string, Offset>> = {
  stirrer: { beaker: { x: -36, y: 43, rotate: 70 } },
}

export const solutionConcentrationLayout: SceneLayout = {
  background: BACKGROUND,
  stage: STAGE,
  home: HOME,
  zones: ZONES,
  spread: { bench: {} },
  attach: ATTACH,
  displays: { balance: { x: 193, y: 516, w: 114, h: 36 } },
  labelSide: { 'spoon-small': 'right', 'spoon-large': 'right' },
  // Di atas batang pengaduk ada sendok besar.
  actionSide: { stirrer: 'right' },
}
