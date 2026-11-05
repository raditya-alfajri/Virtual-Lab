import { pointerWithin, type CollisionDetection } from '@dnd-kit/core'

// Target terkecil di bawah pointer menang, jadi pipet di atas tabung yang ada
// di rak mengenai tabung, bukan zona raknya. Kalau ukurannya sama (tabung di
// rak menempati kotak yang persis sama dengan zonanya), benda menang atas zona.
export function innermostItemFirst(zoneIds: string[]): CollisionDetection {
  const zones = new Set(zoneIds)
  return (args) => {
    const area = (id: string | number) => {
      const rect = args.droppableRects.get(id)
      return rect ? rect.width * rect.height : Infinity
    }
    const rank = (id: string | number) => (zones.has(String(id)) ? 1 : 0)
    return pointerWithin(args)
      .filter((c) => c.id !== args.active.id)
      .sort((a, b) => area(a.id) - area(b.id) || rank(a.id) - rank(b.id))
  }
}
