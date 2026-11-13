import type { SceneLayout } from '../types'

export const reactionRateLayout: SceneLayout = {
  home: {
    flask: { x: 150, y: 562, w: 132, h: 161 },
    thermometer: { x: 640, y: 520, w: 40, h: 210 },
    stopwatch: { x: 730, y: 580, w: 130, h: 150 },
    paper: { x: 330, y: 600, w: 210, h: 134 },
    bath: { x: 990, y: 522, w: 286, h: 208 },
    'thio-005': { x: 104, y: 212, w: 77, h: 128 },
    'thio-010': { x: 184, y: 212, w: 77, h: 128 },
    'thio-015': { x: 264, y: 212, w: 77, h: 128 },
    'thio-020': { x: 372, y: 212, w: 77, h: 128 },
    hcl: { x: 470, y: 212, w: 77, h: 128 },
  },
  zones: {},
  views: [
    { id: 'bench', label: 'Meja', region: { x: 120, y: 480, w: 760, h: 290 } },
    {
      id: 'bath',
      label: 'Penangas',
      region: { x: 930, y: 440, w: 410, h: 340 },
    },
  ],
  attach: {
    flask: {
      paper: { x: 39, y: -71 },
      // Label and button sit beside the flask, above the bath's water layer.
      bath: { x: 77, y: -43, labelSide: 'left', actionSide: 'right' },
    },
    thermometer: {
      flask: { x: 46, y: -56 },
    },
  },
}
