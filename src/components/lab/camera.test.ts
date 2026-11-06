import { describe, it, expect } from 'vitest'
import { SHELF } from '../../data/instruments'
import { acidBaseTest } from '../../data/kimia/acid-base-test'
import { reactionRate } from '../../data/kimia/reaction-rate'
import { solutionConcentration } from '../../data/kimia/solution-concentration'
import type { Experiment } from '../../data/types'
import { acidBaseLayout } from '../../simulations/acid-base-test/layout'
import { reactionRateLayout } from '../../simulations/reaction-rate/layout'
import { solutionConcentrationLayout } from '../../simulations/solution-concentration/layout'
import type { SceneLayout } from '../../simulations/types'
import {
  MIN_TOUCH,
  fitCamera,
  hitArea,
  isInView,
  itemTouchTargets,
  labelScale,
  pickTarget,
  protrudingHitArea,
  trayItems,
  zoneTouchTargets,
} from './camera'

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h })

const k2 = solutionConcentration
const k2Layout = solutionConcentrationLayout
const k2View = (id: string) =>
  k2Layout.mobile!.views.find((v) => v.id === id)!.region
const k2Start = () =>
  Object.fromEntries(k2.items.map((i) => [i.id, { at: i.start ?? SHELF }]))

describe('fitCamera', () => {
  it('fits a wide region by width in portrait and centres it vertically', () => {
    const cam = fitCamera(box(620, 420, 820, 520), { width: 410, height: 600 })
    expect(cam.scale).toBe(0.5)
    expect(cam.x).toBe(-310)
    // Region 260 px tinggi di layar, sisa 340 px dibagi rata.
    expect(cam.y).toBe(170 - 210)
  })

  it('fits by height in landscape and centres horizontally', () => {
    const cam = fitCamera(box(20, 340, 640, 560), { width: 800, height: 280 })
    expect(cam.scale).toBe(0.5)
    expect(cam.x).toBe((800 - 320) / 2 - 10)
    expect(cam.y).toBe(-170)
  })

  it('always scales uniformly so the region is never stretched', () => {
    for (const viewport of [
      { width: 360, height: 740 },
      { width: 740, height: 360 },
      { width: 1, height: 1000 },
    ]) {
      const region = box(0, 200, 700, 600)
      const { scale } = fitCamera(region, viewport)
      expect(region.w * scale).toBeLessThanOrEqual(viewport.width + 1e-9)
      expect(region.h * scale).toBeLessThanOrEqual(viewport.height + 1e-9)
      const fillsOneSide =
        Math.abs(region.w * scale - viewport.width) < 1e-9 ||
        Math.abs(region.h * scale - viewport.height) < 1e-9
      expect(fillsOneSide).toBe(true)
    }
  })

  it('maps the region centre to the viewport centre', () => {
    const region = box(820, 400, 620, 560)
    const viewport = { width: 375, height: 500 }
    const cam = fitCamera(region, viewport)
    const cx = (region.x + region.w / 2) * cam.scale + cam.x
    const cy = (region.y + region.h / 2) * cam.scale + cam.y
    expect(cx).toBeCloseTo(viewport.width / 2)
    expect(cy).toBeCloseTo(viewport.height / 2)
  })

  const stage = { width: 1440, height: 1024 }

  it('slides toward the stage edge instead of showing empty space', () => {
    // Meja timbang K2 di HP potret: tengah region akan menyisakan pita
    // kosong di bawah panggung; kamera turun sampai dasar panggung.
    const region = box(20, 340, 640, 560)
    const viewport = { width: 390, height: 540 }
    const cam = fitCamera(region, viewport, stage)
    expect(stage.height * cam.scale + cam.y).toBeCloseTo(viewport.height)
    expect(cam.y).toBeLessThanOrEqual(0)
  })

  it('centres the stage when it is smaller than the viewport', () => {
    const region = box(620, 420, 820, 520)
    const viewport = { width: 390, height: 540 }
    const cam = fitCamera(region, viewport, stage)
    const top = cam.y
    const bottomGap = viewport.height - (stage.height * cam.scale + cam.y)
    expect(top).toBeCloseTo(bottomGap)
  })

  it('never pushes the region out of view while covering the stage', () => {
    const regions = [
      box(20, 340, 640, 560),
      box(620, 420, 820, 520),
      box(0, 200, 700, 600),
      box(820, 400, 620, 560),
    ]
    const viewports = [
      { width: 390, height: 540 },
      { width: 500, height: 300 },
      { width: 320, height: 900 },
    ]
    for (const region of regions) {
      for (const viewport of viewports) {
        const { scale, x, y } = fitCamera(region, viewport, stage)
        const e = 1e-9
        expect(region.x * scale + x).toBeGreaterThanOrEqual(-e)
        expect(region.y * scale + y).toBeGreaterThanOrEqual(-e)
        expect((region.x + region.w) * scale + x).toBeLessThanOrEqual(
          viewport.width + e,
        )
        expect((region.y + region.h) * scale + y).toBeLessThanOrEqual(
          viewport.height + e,
        )
        // Skala sama dengan tanpa panggung: hanya posisi yang berubah.
        expect(scale).toBe(fitCamera(region, viewport).scale)
      }
    }
  })

  it('hides the stage until the viewport has a size', () => {
    expect(fitCamera(box(0, 0, 100, 100), { width: 0, height: 300 })).toEqual({
      scale: 0,
      x: 0,
      y: 0,
    })
  })
})

describe('isInView', () => {
  const region = box(0, 0, 100, 100)
  it('needs at least half of the item inside the region', () => {
    expect(isInView(box(10, 10, 20, 20), region)).toBe(true)
    expect(isInView(box(90, 10, 20, 20), region)).toBe(true)
    expect(isInView(box(95, 10, 20, 20), region)).toBe(false)
    expect(isInView(box(200, 200, 20, 20), region)).toBe(false)
  })
})

describe('trayItems (K2)', () => {
  it('puts the wall-shelf bottles in the tray on the work bench', () => {
    expect(trayItems(k2, k2Layout, k2Start(), k2View('meja-kerja'))).toEqual([
      'cuso4',
      'water',
    ])
  })

  it('puts every bench tool in the tray on the weighing table', () => {
    expect(trayItems(k2, k2Layout, k2Start(), k2View('meja-timbang'))).toEqual([
      'cuso4',
      'spoon-small',
      'spoon-large',
      'watch-glass',
      'water',
      'cylinder',
      'beaker',
      'stirrer',
    ])
  })

  it('follows the watch glass onto the balance', () => {
    const items = { ...k2Start(), 'watch-glass': { at: 'balance' } }
    expect(
      trayItems(k2, k2Layout, items, k2View('meja-timbang')),
    ).not.toContain('watch-glass')
    expect(trayItems(k2, k2Layout, items, k2View('meja-kerja'))).toContain(
      'watch-glass',
    )
  })

  it('keeps the stirrer with the beaker it stands in', () => {
    const items = { ...k2Start(), stirrer: { at: 'beaker' } }
    expect(trayItems(k2, k2Layout, items, k2View('meja-kerja'))).not.toContain(
      'stirrer',
    )
  })
})

describe('labelScale', () => {
  it('enlarges labels on small scales but never shrinks them', () => {
    expect(labelScale(0.5) * 15 * 0.5).toBeCloseTo(13)
    expect(labelScale(1)).toBe(1)
    expect(labelScale(0)).toBe(1)
  })
})

describe('hitArea', () => {
  it('grows small items from the centre to MIN_TOUCH screen px', () => {
    // Sendok kecil 128 × 40 pada skala 0,5 → 64 × 20 px; perlu 88 di panggung.
    const hit = hitArea(box(1140, 608, 128, 40), 0.5)
    expect(hit).toEqual(box(1140, 584, 128, 88))
    expect(hit.h * 0.5).toBe(MIN_TOUCH)
  })

  it('leaves large items alone', () => {
    expect(hitArea(box(0, 0, 200, 200), 0.5)).toEqual(box(0, 0, 200, 200))
  })
})

describe('protrudingHitArea', () => {
  const parent = box(100, 100, 100, 100)

  it('only covers the part sticking out, grown away from the parent', () => {
    // Termometer 20 lebar, menonjol 30 di atas induk; skala 1 → perlu 44.
    const hit = protrudingHitArea(box(140, 70, 20, 120), parent, 1)
    expect(hit).toEqual(box(128, 56, 44, 44))
    expect(hit!.y + hit!.h).toBe(parent.y)
  })

  it('grows sideways strips away from the parent', () => {
    const hit = protrudingHitArea(box(180, 140, 40, 10), parent, 1)
    expect(hit).toEqual(box(200, 123, 44, 44))
  })

  it('picks the largest protruding side', () => {
    const hit = protrudingHitArea(box(90, 50, 30, 60), parent, 1)
    // Atas 30 × 50 lebih besar dari kiri 10 × 60.
    expect(hit!.y + hit!.h).toBe(parent.y)
  })

  it('returns null for an item fully inside its parent', () => {
    expect(protrudingHitArea(box(120, 120, 20, 20), parent, 1)).toBeNull()
  })
})

describe('touch targets (K2)', () => {
  const scale = 0.45

  it('gives every item and zone at least MIN_TOUCH px', () => {
    const items = { ...k2Start(), 'watch-glass': { at: 'balance' } }
    for (const t of [
      ...itemTouchTargets(k2, k2Layout, items, scale),
      ...zoneTouchTargets(k2Layout, scale),
    ]) {
      expect(t.hit.w * scale).toBeGreaterThanOrEqual(MIN_TOUCH - 1e-9)
      expect(t.hit.h * scale).toBeGreaterThanOrEqual(MIN_TOUCH - 1e-9)
    }
  })

  it('keeps the stirrer in the beaker off the beaker body', () => {
    const items = { ...k2Start(), stirrer: { at: 'beaker' } }
    const targets = itemTouchTargets(k2, k2Layout, items, scale)
    const stirrer = targets.find((t) => t.id === 'stirrer')!
    const beaker = k2Layout.home.beaker
    expect(stirrer.hit.y + stirrer.hit.h).toBeLessThanOrEqual(beaker.y + 1e-9)
    // Ketukan di atas bibir gelas memilih batang pengaduk.
    expect(pickTarget({ x: 714, y: 520 }, targets)).toBe('stirrer')
  })

  it('picks the item whose real box is nearest to the tap', () => {
    const targets = itemTouchTargets(k2, k2Layout, k2Start(), scale)
    // Antara sendok kecil (608–648) dan sendok besar (648–698), lebih dekat
    // ke sendok kecil.
    expect(pickTarget({ x: 1200, y: 600 }, targets)).toBe('spoon-small')
    expect(pickTarget({ x: 1200, y: 740 }, targets)).toBe('stirrer')
    expect(pickTarget({ x: 400, y: 900 }, targets)).toBeNull()
  })
})

const startOf = (exp: Experiment) =>
  Object.fromEntries(exp.items.map((i) => [i.id, { at: i.start ?? SHELF }]))
const viewOf = (layout: SceneLayout, id: string) =>
  layout.mobile!.views.find((v) => v.id === id)!.region

describe('mobile views', () => {
  const all: [string, SceneLayout][] = [
    ['K1', acidBaseLayout],
    ['K2', solutionConcentrationLayout],
    ['K3', reactionRateLayout],
  ]

  it.each(all)('%s views stay on the 1440 × 1024 stage', (_, layout) => {
    for (const { region } of layout.mobile!.views) {
      expect(region.x).toBeGreaterThanOrEqual(0)
      expect(region.y).toBeGreaterThanOrEqual(0)
      expect(region.x + region.w).toBeLessThanOrEqual(layout.stage.width)
      expect(region.y + region.h).toBeLessThanOrEqual(layout.stage.height)
    }
  })
})

describe('trayItems (K1)', () => {
  const k1 = acidBaseTest
  const bottles = ['cuka', 'air-jeruk', 'air-suling', 'air-sabun', 'naoh']

  it('keeps only the wall-shelf bottles in the tray on the bench', () => {
    expect(
      trayItems(
        k1,
        acidBaseLayout,
        startOf(k1),
        viewOf(acidBaseLayout, 'meja'),
      ),
    ).toEqual(bottles)
  })

  it('offers the bench tools at the rack and pH card', () => {
    const tray = trayItems(
      k1,
      acidBaseLayout,
      startOf(k1),
      viewOf(acidBaseLayout, 'rak-kartu'),
    )
    expect(tray).toEqual(['tube-1', 'pipette', ...bottles, 'indicator'])
  })

  it('offers the tubes at the sink, where pipette and indicator stand', () => {
    const tray = trayItems(
      k1,
      acidBaseLayout,
      startOf(k1),
      viewOf(acidBaseLayout, 'wastafel'),
    )
    expect(tray).toEqual(['tube-1', 'tube-2', 'tube-3', ...bottles])
  })

  it('shows a racked tube at the rack, not on the bench', () => {
    const items = { ...startOf(k1), 'tube-1': { at: 'rack-3' } }
    expect(
      trayItems(k1, acidBaseLayout, items, viewOf(acidBaseLayout, 'rak-kartu')),
    ).not.toContain('tube-1')
    expect(
      trayItems(k1, acidBaseLayout, items, viewOf(acidBaseLayout, 'meja')),
    ).toContain('tube-1')
  })
})

describe('trayItems (K3)', () => {
  const k3 = reactionRate
  const bottles = ['thio-005', 'thio-010', 'thio-015', 'thio-020', 'hcl']

  it('never lists the fixed paper and water bath', () => {
    for (const { region } of reactionRateLayout.mobile!.views) {
      const tray = trayItems(k3, reactionRateLayout, startOf(k3), region)
      expect(tray).not.toContain('paper')
      expect(tray).not.toContain('bath')
    }
  })

  it('keeps only the wall-shelf bottles in the tray on the bench', () => {
    expect(
      trayItems(
        k3,
        reactionRateLayout,
        startOf(k3),
        viewOf(reactionRateLayout, 'meja'),
      ),
    ).toEqual(bottles)
  })

  it('offers the flask, thermometer and stopwatch at the water bath', () => {
    expect(
      trayItems(
        k3,
        reactionRateLayout,
        startOf(k3),
        viewOf(reactionRateLayout, 'penangas'),
      ),
    ).toEqual(['flask', ...bottles, 'thermometer', 'stopwatch'])
  })

  it('moves the flask and its thermometer along to the water bath', () => {
    const items = {
      ...startOf(k3),
      flask: { at: 'bath' },
      thermometer: { at: 'flask' },
    }
    const atBath = trayItems(
      k3,
      reactionRateLayout,
      items,
      viewOf(reactionRateLayout, 'penangas'),
    )
    expect(atBath).not.toContain('flask')
    expect(atBath).not.toContain('thermometer')
    const atBench = trayItems(
      k3,
      reactionRateLayout,
      items,
      viewOf(reactionRateLayout, 'meja'),
    )
    expect(atBench).toContain('flask')
    expect(atBench).toContain('thermometer')
  })
})

describe('touch targets (K3 attached items)', () => {
  const k3 = reactionRate
  const scale = 0.5
  const onBath = {
    ...startOf(k3),
    flask: { at: 'bath' },
    thermometer: { at: 'flask' },
  }
  const onPaper = {
    ...startOf(k3),
    flask: { at: 'paper' },
    thermometer: { at: 'flask' },
  }
  // Labu di penangas: penangas (990, 522) + offset (77, -18).
  const flaskOnBath = { x: 1067, y: 504, w: 132, h: 161 }
  // Labu di kertas: kertas (330, 600) + offset (39, -60).
  const flaskOnPaper = { x: 369, y: 540, w: 132, h: 161 }
  const centre = (r: { x: number; y: number; w: number; h: number }) => ({
    x: r.x + r.w / 2,
    y: r.y + r.h / 2,
  })
  const targets = (items: Record<string, { at: string }>, selecting: boolean) =>
    itemTouchTargets(k3, reactionRateLayout, items, scale, selecting)

  it('gives every item at least MIN_TOUCH px in both set-ups', () => {
    for (const items of [startOf(k3), onBath, onPaper]) {
      for (const t of targets(items, true)) {
        expect(t.hit.w * scale).toBeGreaterThanOrEqual(MIN_TOUCH - 1e-9)
        expect(t.hit.h * scale).toBeGreaterThanOrEqual(MIN_TOUCH - 1e-9)
      }
    }
  })

  it('picks the flask, not the water bath under it', () => {
    const p = centre(flaskOnBath)
    expect(pickTarget(p, targets(onBath, false))).toBe('flask')
    // Dengan benda terpilih (mis. HCl), labu tetap tujuannya.
    expect(pickTarget(p, targets(onBath, true))).toBe('flask')
  })

  it('still reaches the water bath beside the flask when choosing a target', () => {
    const p = { x: 1010, y: 700 }
    expect(pickTarget(p, targets(onBath, true))).toBe('bath')
    // Tanpa benda terpilih, penangas tidak bisa dipilih.
    expect(pickTarget(p, targets(onBath, false))).toBeNull()
  })

  it('picks the flask, not the cross paper under it', () => {
    const p = { x: 435, y: 670 }
    expect(pickTarget(p, targets(onPaper, false))).toBe('flask')
    expect(pickTarget(p, targets(onPaper, true))).toBe('flask')
  })

  it('keeps the thermometer off the flask body', () => {
    for (const [items, flask] of [
      [onBath, flaskOnBath],
      [onPaper, flaskOnPaper],
    ] as const) {
      const thermometer = targets(items, false).find(
        (t) => t.id === 'thermometer',
      )!
      // Area sentuh termometer berhenti di mulut labu.
      expect(thermometer.hit.y + thermometer.hit.h).toBeCloseTo(flask.y)
      expect(pickTarget(centre(flask), targets(items, false))).toBe('flask')
      // Tepat di atas mulut labu, termometer yang terpilih.
      expect(
        pickTarget({ x: flask.x + 66, y: flask.y - 20 }, targets(items, false)),
      ).toBe('thermometer')
    }
  })
})
