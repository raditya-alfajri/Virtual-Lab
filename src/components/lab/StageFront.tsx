import type { ItemDef, ItemView } from '../../data/types'
import type { Rect } from '../../simulations/types'
import { FRONTS } from './assets/fronts'

type Props = {
  item: ItemDef
  rect: Rect
  zIndex: number
  view?: ItemView
}

/** The front part of an asset, laid over the items standing in it. */
export default function StageFront({ item, rect, zIndex, view = {} }: Props) {
  const Front = FRONTS[item.kind]
  if (!Front) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex,
      }}
    >
      <Front name={item.name} view={view} />
    </div>
  )
}
