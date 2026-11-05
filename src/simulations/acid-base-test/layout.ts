import type { Rect, SceneLayout } from '../types'

// Semua angka dari Figma, dalam koordinat panggung 1440 × 1024.
export const STAGE = { width: 1440, height: 1024 }

export const BACKGROUND = '/img/lab/asam-basa-bg.svg'

export const HOME: Record<string, Rect> = {
  indicator: { x: 513, y: 540, w: 90, h: 160 },
  pipette: { x: 627, y: 515, w: 44, h: 180 },
  'tube-1': { x: 695, y: 540, w: 80, h: 170 },
  'tube-2': { x: 788, y: 540, w: 80, h: 170 },
  'tube-3': { x: 870, y: 539, w: 80, h: 170 },
  cuka: { x: 900, y: 71, w: 90, h: 150 },
  'air-jeruk': { x: 992, y: 71, w: 90, h: 150 },
  'air-suling': { x: 1084, y: 71, w: 90, h: 150 },
  'air-sabun': { x: 1176, y: 71, w: 90, h: 150 },
  naoh: { x: 1268, y: 71, w: 90, h: 150 },
}

export const ZONES: Record<string, Rect> = {
  'rack-1': { x: 1050, y: 520, w: 80, h: 170 },
  'rack-2': { x: 1162, y: 520, w: 80, h: 170 },
  'rack-3': { x: 1275, y: 520, w: 80, h: 170 },
  'ph-card': { x: 979, y: 838, w: 429, h: 150 },
  sink: { x: 0, y: 230, w: 427, h: 356 },
}

export const acidBaseLayout: SceneLayout = {
  background: BACKGROUND,
  stage: STAGE,
  home: HOME,
  zones: ZONES,
}
