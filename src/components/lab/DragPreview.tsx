import { DragOverlay } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import type { ItemDef, ItemView } from '../../data/types'
import type { Rect } from '../../simulations/types'
import LabAsset from './LabAsset'
import { useStageScale } from './stage-scale'

type Props = {
  item?: ItemDef
  rect?: Rect
  view?: ItemView
}

/**
 * The copy of an item that follows the pointer. It lives in a portal so the
 * stage does not clip it on its way to the shelf strip below.
 */
export default function DragPreview({ item, rect, view }: Props) {
  const scale = useStageScale()
  return createPortal(
    <DragOverlay dropAnimation={null} zIndex={3000} className="cursor-grabbing">
      {item && rect && (
        <div
          className="origin-top-left"
          style={{
            width: rect.w,
            height: rect.h,
            transform: `scale(${scale})`,
          }}
        >
          <LabAsset kind={item.kind} name={item.name} view={view} />
        </div>
      )}
    </DragOverlay>,
    document.body,
  )
}
