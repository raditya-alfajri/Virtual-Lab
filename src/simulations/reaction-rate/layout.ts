import type { Offset, Rect, SceneLayout } from '../types'

// Koordinat panggung 1440 × 1024.
export const STAGE = { width: 1440, height: 1024 }

// Penangas air dan kertas silang tidak ada di background; keduanya benda tetap.
export const BACKGROUND = '/img/lab/laju-reaksi-bg.svg'

export const HOME: Record<string, Rect> = {
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
}

export const ZONES: Record<string, Rect> = {
  bench: { x: 160, y: 560, w: 1140, h: 200 },
}

// Labu 132 × 161 (Erlenmeyer 120 × 146 diperbesar 1,1); cairan setengah
// penuh mengisi y ≈ 103–150 di dalam kotak labu.
export const ATTACH: Record<string, Record<string, Offset>> = {
  flask: {
    // Tanda silang (pusat kertas, 105, 67) tampak menembus cairan labu.
    paper: { x: 39, y: -60 },
    // Dasar labu di dasar bak, di tengah penangas (bak 286 × 208 = 220 × 160
    // diperbesar 1,3). Label di kiri agar tidak menutupi sakelar pemanas.
    bath: { x: 77, y: -18, labelSide: 'left' },
  },
  // Lewat leher labu, tabung termometer tercelup di cairan.
  thermometer: { flask: { x: 46, y: -53 } },
}

export const reactionRateLayout: SceneLayout = {
  background: BACKGROUND,
  stage: STAGE,
  home: HOME,
  zones: ZONES,
  spread: { bench: {} },
  attach: ATTACH,
  // Di bawah kertas tertutup label labu; di bawah termometer yang terpasang
  // ada labu.
  labelSide: { paper: 'right', thermometer: 'right' },
  // Di atas penangas ada labu dan termometer saat dipanaskan.
  actionSide: { bath: 'right' },
  // Botol Na₂S₂O₃ dan HCl di rak dinding tidak masuk area mana pun; diambil
  // dari rak alat di bawah adegan.
  mobile: {
    views: [
      {
        id: 'meja',
        label: 'Meja',
        region: { x: 120, y: 420, w: 780, h: 560 },
      },
      {
        id: 'penangas',
        label: 'Penangas',
        region: { x: 820, y: 400, w: 620, h: 560 },
      },
    ],
    // Tombol Nyalakan yang diperbesar di kanan penangas keluar dari tepi
    // panggung; di bawah penangas masih ada ruang meja.
    actionSide: { bath: 'bottom' },
    // Label penangas pindah dari bawah (tempat tombol Nyalakan) ke kanan.
    labelSide: { bath: 'right' },
  },
}
