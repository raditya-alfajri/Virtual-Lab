import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useCallback } from 'react'
import type { ItemDef, ItemView } from '../../data/types'
import type { Placement, Side } from '../../simulations/types'
import type { DropData } from './drop-target'
import { onActivateKey } from './keyboard'
import LabAsset, { type AssetTurn } from './LabAsset'

const ACTION_SIDE_CLASS: Record<Side, string> = {
  below: 'top-full left-1/2 mt-9 -translate-x-1/2',
  above: 'bottom-full left-1/2 mb-3 -translate-x-1/2',
  right: 'top-1/2 left-full ml-3 -translate-y-1/2',
  left: 'top-1/2 right-full mr-3 -translate-y-1/2',
}

type Props = {
  item: ItemDef
  rect: Placement
  turn?: AssetTurn
  labelSide?: Side
  zIndex: number
  view?: ItemView
  selected: boolean
  /** Rides along with the item being dragged, so it cannot be a drop target. */
  /** False for items no interaction targets, so drops reach what lies beneath. */
  droppable: boolean
  carried: boolean
  showReading: boolean
  actionSide: Side
  /** Only the drawn parts take the pointer, so the item it rests on stays easy to grab. */
  grabByDrawing: boolean
  onClick: (itemId: string) => void
  onAction: (itemId: string) => void
}

export default function StageItem({
  item,
  rect,
  turn,
  labelSide,
  zIndex,
  view,
  selected,
  droppable,
  carried,
  showReading,
  actionSide,
  grabByDrawing,
  onClick,
  onAction,
}: Props) {
  const fixed = item.fixed === true
  const drag = useDraggable({ id: item.id, disabled: fixed })
  const dropData: DropData = { layer: 'item', order: zIndex }
  const drop = useDroppable({
    id: item.id,
    data: dropData,
    disabled: carried || !droppable,
  })
  const { setNodeRef: setDragRef } = drag
  const { setNodeRef: setDropRef } = drop
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )

  return (
    <div
      className={clsx('absolute', (drag.isDragging || carried) && 'opacity-30')}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex,
      }}
    >
      <div
        ref={setNodeRef}
        {...drag.listeners}
        {...drag.attributes}
        role="button"
        tabIndex={0}
        aria-label={item.name}
        aria-pressed={selected}
        onClick={() => onClick(item.id)}
        onKeyDown={onActivateKey(() => onClick(item.id))}
        className={clsx(
          'size-full touch-none rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-primary/60',
          selected && 'ring-4 ring-primary ring-offset-4 ring-offset-bg',
          grabByDrawing && 'pointer-events-none [&_svg_*]:pointer-events-auto',
          fixed
            ? 'cursor-pointer'
            : drag.isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab',
        )}
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
      {view?.action && (
        <button
          type="button"
          onClick={() => onAction(item.id)}
          className={clsx(
            'absolute rounded-full bg-primary px-3 py-1 text-sm font-semibold whitespace-nowrap text-bg shadow hover:brightness-110',
            ACTION_SIDE_CLASS[actionSide],
          )}
        >
          {view.action}
        </button>
      )}
    </div>
  )
}
