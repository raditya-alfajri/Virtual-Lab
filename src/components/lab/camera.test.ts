import { describe, it, expect } from 'vitest'
import { SHELF } from '../../data/instruments'
import { solutionConcentration } from '../../data/kimia/solution-concentration'
import { solutionConcentrationLayout } from '../../simulations/solution-concentration/layout'
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
