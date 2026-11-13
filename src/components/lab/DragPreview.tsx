import { DragOverlay, type Modifiers } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import type { ItemDef, ItemView } from '../../data/types'
import type { Placement, Side } from '../../simulations/types'
import LabAsset, { type AssetTurn } from './LabAsset'
import { useStageScale } from './stage-scale'

export type PreviewPiece = {
  item: ItemDef
  rect: Placement
  turn?: AssetTurn
  labelSide?: Side
  view?: ItemView
  showReading: boolean
}

type Props = {
  /** The dragged item first, then the items riding on it, bottom to top. */
  pieces: PreviewPiece[]
  modifiers?: Modifiers
}

/**
 * The copy of an item that follows the pointer. It lives in a portal so the
 * stage does not clip it on its way to the shelf strip below.
 */
export default function DragPreview({ pieces, modifiers }: Props) {
  const scale = useStageScale()
  const root = pieces[0]?.rect
  return createPortal(
    <DragOverlay
      dropAnimation={null}
      zIndex={3000}
      modifiers={modifiers}
      className="cursor-grabbing"
    >
      {root && (
        <div
          className="relative origin-top-left"
          style={{
            width: root.w,
            height: root.h,
            transform: `scale(${scale})`,
          }}
        >
          {pieces.map(({ item, rect, turn, labelSide, view, showReading }) => (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: rect.x - root.x,
                top: rect.y - root.y,
                width: rect.w,
                height: rect.h,
              }}
            >
              <LabAsset
                kind={item.kind}
                name={item.name}
                view={view}
                turn={turn}
                labelSide={labelSide}
                showReading={showReading}
              />
            </div>
          ))}
        </div>
      )}
    </DragOverlay>,
    document.body,
  )
}
