import { DragOverlay } from '@dnd-kit/core'
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
  /**
   * Centres the copy on the element that was grabbed, for drags that start
   * on a tool-rack button rather than on the item's own drawing.
   */
  centred?: boolean
}

/**
 * The copy of an item that follows the pointer. It lives in a portal so the
 * stage does not clip it on its way to the shelf strip below.
 */
export default function DragPreview({ pieces, centred = false }: Props) {
  const scale = useStageScale()
  const root = pieces[0]?.rect
  return createPortal(
    <DragOverlay dropAnimation={null} zIndex={3000} className="cursor-grabbing">
      {root && (
        <div
          className={
            centred ? 'absolute top-1/2 left-1/2' : 'relative origin-top-left'
          }
          style={{
            width: root.w,
            height: root.h,
            transform: centred
              ? `translate(-50%, -50%) scale(${scale})`
              : `scale(${scale})`,
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
