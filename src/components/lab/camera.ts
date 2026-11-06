import type { Experiment } from '../../data/types'
import type { Rect, SceneLayout } from '../../simulations/types'
import { boundsOf, placeItem } from './placement'

// Hitungan mode HP: kamera yang memperbesar satu area kerja, benda yang masuk
// rak alat, dan area sentuh benda. Semua dalam koordinat panggung kecuali
// disebut lain.

// Ukuran sentuh minimal (px layar).
export const MIN_TOUCH = 44
// Teks label 15 px di panggung tampil sekitar 13 px di layar HP.
const LABEL_RATIO = 13 / 15

export type Size = { width: number; height: number }
export type Point = { x: number; y: number }
// Panggung digeser (x, y px layar) lalu diskalakan dari pojok kiri atas:
// titik panggung p tampil di layar pada p × scale + (x, y).
export type Camera = { scale: number; x: number; y: number }
export type TouchTarget = { id: string; bounds: Rect; hit: Rect }

type Items = Record<string, { at: string }>

const right = (r: Rect) => r.x + r.w
const bottom = (r: Rect) => r.y + r.h
const area = (r: Rect) => r.w * r.h

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi)

// Posisi kamera pada satu sumbu (px layar). Region di tengah; kalau `stage`
// diberikan, digeser agar bingkai sebanyak mungkin terisi panggung (tanpa
// pita kosong di luar panggung), dengan region tetap terlihat utuh.
function shift(
  view: number,
  start: number,
  length: number,
  scale: number,
  stage?: number,
): number {
  const centred = (view - length * scale) / 2 - start * scale
  if (stage === undefined) return centred
  const shown = stage * scale
  const covered =
    shown <= view ? (view - shown) / 2 : clamp(centred, view - shown, 0)
  // Tepi awal region tidak keluar di kiri/atas, tepi akhirnya tidak keluar di
  // kanan/bawah (selalu mungkin karena region sudah dimuatkan).
  return clamp(covered, -start * scale, view - (start + length) * scale)
}

// Region dimuatkan utuh ke viewport (contain) dengan skala seragam; sisa
// ruang menampilkan adegan di sekitarnya.
export function fitCamera(region: Rect, viewport: Size, stage?: Size): Camera {
  if (viewport.width <= 0 || viewport.height <= 0 || area(region) <= 0) {
    return { scale: 0, x: 0, y: 0 }
  }
  const scale = Math.min(viewport.width / region.w, viewport.height / region.h)
  return {
    scale,
    x: shift(viewport.width, region.x, region.w, scale, stage?.width),
    y: shift(viewport.height, region.y, region.h, scale, stage?.height),
  }
}

// Benda dianggap terlihat di area kerja kalau minimal separuh luasnya ada di
// dalam region.
export function isInView(rect: Rect, region: Rect): boolean {
  if (area(rect) <= 0) return false
  const w = Math.min(right(rect), right(region)) - Math.max(rect.x, region.x)
  const h = Math.min(bottom(rect), bottom(region)) - Math.max(rect.y, region.y)
  if (w <= 0 || h <= 0) return false
  return (w * h) / area(rect) >= 0.5
}

// Benda yang bisa diseret tetapi tidak terlihat di area aktif (mis. botol di
// rak dinding), urut seperti di data eksperimen.
export function trayItems(
  exp: Experiment,
  layout: SceneLayout,
  items: Items,
  region: Rect,
): string[] {
  return exp.items
    .filter((item) => {
      if (item.fixed) return false
      const spot = placeItem(layout, items, item.id)
      return spot !== null && !isInView(boundsOf(spot), region)
    })
    .map((item) => item.id)
}

// Skala label dan tombol aksi di panggung agar tetap terbaca di HP. Tidak
// pernah memperkecil.
export function labelScale(scale: number): number {
  return scale > 0 ? Math.max(1, LABEL_RATIO / scale) : 1
}

type Anchor = 'center' | 'top' | 'bottom' | 'left' | 'right'

// Memperbesar kotak sampai minimal `need` di tiap sisi. Sisi `anchor` tetap
// di tempatnya (mis. 'bottom': tepi bawah tetap, kotak tumbuh ke atas).
function grow(r: Rect, need: number, anchor: Anchor): Rect {
  const w = Math.max(r.w, need)
  const h = Math.max(r.h, need)
  const x =
    anchor === 'left'
      ? r.x
      : anchor === 'right'
        ? right(r) - w
        : r.x - (w - r.w) / 2
  const y =
    anchor === 'top'
      ? r.y
      : anchor === 'bottom'
        ? bottom(r) - h
        : r.y - (h - r.h) / 2
  return { x, y, w, h }
}

// Area sentuh benda atau zona: kotaknya sendiri, diperbesar dari tengah
// sampai minimal MIN_TOUCH px layar pada skala yang tampil.
export function hitArea(rect: Rect, scale: number, min = MIN_TOUCH): Rect {
  return scale > 0 ? grow(rect, min / scale, 'center') : rect
}

// Area sentuh benda yang menempel (mis. batang pengaduk di gelas): hanya
// bagian terbesar yang menonjol keluar dari kotak induk, diperbesar menjauhi
// induk, agar induknya tetap bisa diketuk. Null kalau benda tidak menonjol.
export function protrudingHitArea(
  rect: Rect,
  parent: Rect,
  scale: number,
  min = MIN_TOUCH,
): Rect | null {
  const strips: [Rect, Anchor][] = [
    [
      {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: Math.min(parent.y, bottom(rect)) - rect.y,
      },
      'bottom',
    ],
    [
      {
        x: rect.x,
        y: Math.max(bottom(parent), rect.y),
        w: rect.w,
        h: bottom(rect) - Math.max(bottom(parent), rect.y),
      },
      'top',
    ],
    [
      {
        x: rect.x,
        y: rect.y,
        w: Math.min(parent.x, right(rect)) - rect.x,
        h: rect.h,
      },
      'right',
    ],
    [
      {
        x: Math.max(right(parent), rect.x),
        y: rect.y,
        w: right(rect) - Math.max(right(parent), rect.x),
        h: rect.h,
      },
      'left',
    ],
  ]
  const outside = strips.filter(([s]) => s.w > 0 && s.h > 0)
  if (!outside.length || scale <= 0) return null
  const [strip, anchor] = outside.reduce((a, b) =>
    area(b[0]) > area(a[0]) ? b : a,
  )
  return grow(strip, min / scale, anchor)
}

// Area sentuh benda yang tampil di panggung. Benda tetap (mis. penangas)
// tidak bisa dipilih, jadi hanya ikut dihitung sebagai tujuan saat ada benda
// terpilih (`includeFixed`).
//
// Benda yang menempel pada benda biasa (mis. termometer di labu) hanya bisa
// disentuh di bagian yang menonjol, agar induknya tetap bisa dipilih. Di atas
// benda tetap (mis. labu di penangas atau kertas silang), seluruh kotaknya
// bisa disentuh: induknya tidak bisa dipilih, dan kotak benda yang lebih kecil
// menang atas induknya saat keduanya memuat titik ketukan.
export function itemTouchTargets(
  exp: Experiment,
  layout: SceneLayout,
  items: Items,
  scale: number,
  includeFixed = true,
): TouchTarget[] {
  const fixed = (id: string) =>
    exp.items.find((i) => i.id === id)?.fixed === true
  const targets: TouchTarget[] = []
  for (const item of exp.items) {
    if (item.fixed && !includeFixed) continue
    const spot = placeItem(layout, items, item.id)
    if (!spot) continue
    const bounds = boundsOf(spot)
    const parentId = spot.parents[0]
    const parent =
      parentId && !fixed(parentId) ? placeItem(layout, items, parentId) : null
    const hit = parent
      ? protrudingHitArea(bounds, boundsOf(parent), scale)
      : hitArea(bounds, scale)
    if (hit) targets.push({ id: item.id, bounds, hit })
  }
  return targets
}

export function zoneTouchTargets(
  layout: SceneLayout,
  scale: number,
): TouchTarget[] {
  return Object.entries(layout.zones).map(([id, rect]) => ({
    id,
    bounds: rect,
    hit: hitArea(rect, scale),
  }))
}

const contains = (r: Rect, p: Point) =>
  p.x >= r.x && p.x <= right(r) && p.y >= r.y && p.y <= bottom(r)

const distance = (r: Rect, p: Point) =>
  Math.hypot(
    Math.max(r.x - p.x, 0, p.x - right(r)),
    Math.max(r.y - p.y, 0, p.y - bottom(r)),
  )

// Tujuan ketukan di titik p: dari area sentuh yang memuat p, yang kotak
// aslinya paling dekat; kalau sama dekat, yang lebih kecil.
export function pickTarget(p: Point, targets: TouchTarget[]): string | null {
  let best: TouchTarget | null = null
  let bestDistance = Infinity
  for (const t of targets) {
    if (!contains(t.hit, p)) continue
    const d = distance(t.bounds, p)
    if (
      d < bestDistance ||
      (d === bestDistance && best && area(t.bounds) < area(best.bounds))
    ) {
      best = t
      bestDistance = d
    }
  }
  return best?.id ?? null
}
