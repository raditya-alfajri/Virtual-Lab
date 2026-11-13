import type { SceneLayout } from '../types'

export const solutionConcentrationLayout: SceneLayout = {
  views: [
    {
      id: 'balance',
      label: 'Timbangan',
      region: { x: 60, y: 110, w: 400, h: 480 },
    },
    {
      id: 'bench',
      label: 'Meja kerja',
      // Wide enough for the labels right of the spoons.
      region: { x: 630, y: 470, w: 780, h: 290 },
    },
  ],
  home: {
    cuso4: { x: 120, y: 170, w: 100, h: 130 },
    water: { x: 300, y: 130, w: 110, h: 170 },
    beaker: { x: 660, y: 540, w: 144, h: 161 },
    cylinder: { x: 840, y: 500, w: 64, h: 200 },
    'watch-glass': { x: 950, y: 620, w: 150, h: 80 },
    'spoon-small': { x: 1140, y: 608, w: 128, h: 40 },
    'spoon-large': { x: 1140, y: 648, w: 160, h: 50 },
    stirrer: { x: 1150, y: 702, w: 180, h: 24 },
  },
  zones: {
    balance: { x: 175, y: 392, w: 150, h: 80 },
  },
  attach: {
    // Nearly upright against the right wall, its foot near the bottom of the
    // glass, so it leaves the middle of the beaker free as a drop target.
    // The action button goes above, clear of the beaker's own label.
    stirrer: { beaker: { x: 11, y: 43, rotate: 96, actionSide: 'above' } },
  },
  screens: {
    balance: { x: 193, y: 516, w: 114, h: 36 },
  },
  // The spoons and the stirrer lie too close together for labels below.
  labelSide: {
    'spoon-small': 'right',
    'spoon-large': 'right',
  },
}
