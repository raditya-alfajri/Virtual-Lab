import type { LabelSide, Rect, SceneLayout } from '../../simulations/types'

export type Placement = {
  rect: Rect
  rotate: number
  // Rantai induk, dari induk langsung sampai benda paling bawah.
  parents: string[]
  // Sisi label selama menempel, kalau offset-nya menentukan.
  labelSide?: LabelSide
}

type Items = Record<string, { at: string }>

// Posisi benda di panggung:
// - di zona biasa (mis. rak tabung K1): kotak zona itu;
// - di zona `spread` (mis. meja kerja): posisi khususnya, atau posisi home;
// - menempel pada benda lain: posisi induk + offset di `attach`, sehingga ikut
//   berpindah bersama induknya; tanpa offset, benda ditaruh di tengah induk;
// - selain itu (rak alat & bahan): posisi home.
export function placeItem(
  layout: SceneLayout,
  items: Items,
  id: string,
  seen: string[] = [],
): Placement | null {
  const home = layout.home[id]
  const at = items[id]?.at

  const spread = layout.spread?.[at]
  if (spread) return place(spread[id] ?? home)
  if (layout.zones[at]) return place(layout.zones[at])

  if (at in items && !seen.includes(at)) {
    const parent = placeItem(layout, items, at, [...seen, id])
    if (!parent || !home) return place(home)
    const offset = layout.attach?.[id]?.[at]
    const w = offset?.w ?? home.w
    const h = offset?.h ?? home.h
    const { x, y } = parent.rect
    return {
      rect: offset
        ? { x: x + offset.x, y: y + offset.y, w, h }
        : {
            x: x + (parent.rect.w - w) / 2,
            y: y + (parent.rect.h - h) / 2,
            w,
            h,
          },
      rotate: offset?.rotate ?? 0,
      parents: [at, ...parent.parents],
      ...(offset?.labelSide && { labelSide: offset.labelSide }),
    }
  }

  return place(home)
}

const place = (rect: Rect | undefined): Placement | null =>
  rect ? { rect, rotate: 0, parents: [] } : null

// Kotak pembatas setelah diputar dari tengahnya, untuk menaruh tombol aksi.
export function boundsOf({ rect, rotate }: Placement): Rect {
  if (!rotate) return rect
  const rad = (rotate * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const w = rect.w * cos + rect.h * sin
  const h = rect.w * sin + rect.h * cos
  return {
    x: rect.x + (rect.w - w) / 2,
    y: rect.y + (rect.h - h) / 2,
    w,
    h,
  }
}
