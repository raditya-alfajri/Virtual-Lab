import type { SceneLayout } from '../types'

export const acidBaseTestLayout: SceneLayout = {
  home: {
    indicator: { x: 513, y: 540, w: 90, h: 160 },
    pipette: { x: 627, y: 515, w: 44, h: 180 },
    'tube-1': { x: 695, y: 540, w: 80, h: 170 },
    'tube-2': { x: 788, y: 540, w: 80, h: 170 },
    'tube-3': { x: 870, y: 539, w: 80, h: 170 },
    'bottle-cuka': { x: 900, y: 71, w: 90, h: 150 },
    'bottle-jeruk': { x: 992, y: 71, w: 90, h: 150 },
    'bottle-suling': { x: 1084, y: 71, w: 90, h: 150 },
    'bottle-sabun': { x: 1176, y: 71, w: 90, h: 150 },
    'bottle-naoh': { x: 1268, y: 71, w: 90, h: 150 },
  },
  zones: {
    'rack-1': { x: 1050, y: 520, w: 80, h: 170 },
    'rack-2': { x: 1162, y: 520, w: 80, h: 170 },
    'rack-3': { x: 1275, y: 520, w: 80, h: 170 },
    'ph-card': { x: 979, y: 838, w: 429, h: 150 },
    sink: { x: 0, y: 230, w: 427, h: 356 },
  },
  attach: {},
  mobile: {
    views: [
      // Narrower than the bench art so the edge cuts no rack in half;
      // the first rack stays in view for setting tubes down.
      { id: 'meja', name: 'Meja', region: { x: 470, y: 420, w: 670, h: 604 } },
      {
        id: 'rak-kartu',
        name: 'Rak & kartu pH',
        region: { x: 760, y: 420, w: 680, h: 604 },
      },
      {
        id: 'wastafel',
        name: 'Wastafel',
        region: { x: 0, y: 200, w: 700, h: 600 },
      },
    ],
  },
}
