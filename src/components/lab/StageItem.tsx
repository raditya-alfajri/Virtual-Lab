import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useCallback } from 'react'
import type { ItemDef, ItemView } from '../../data/types'
import type { LabelSide, Placement } from '../../simulations/types'
import type { DropData } from './drop-target'
import { onActivateKey } from './keyboard'
import LabAsset, { type AssetTurn } from './LabAsset'

type Props = {
  item: ItemDef
  rect: Placement
  turn?: AssetTurn
  labelSide?: LabelSide
  zIndex: number
  view?: ItemView
  selected: boolean
  /** Rides along with the item being dragged, so it cannot be a drop target. */
  carried: boolean
  showReading: boolean
  /** Puts the action button above the item, clear of what it rests on. */
  actionAbove: boolean
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
  carried,
  showReading,
  actionAbove,
  onClick,
  onAction,
}: Props) {
  const fixed = item.fixed === true
  const drag = useDraggable({ id: item.id, disabled: fixed })
  const dropData: DropData = { layer: 'item', order: zIndex }
  const drop = useDroppable({
    id: item.id,
    data: dropData,
    disabled: carried,
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
            'absolute left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm font-semibold whitespace-nowrap text-bg shadow hover:brightness-110',
            actionAbove ? 'bottom-full mb-3' : 'top-full mt-9',
          )}
        >
          {view.action}
        </button>
      )}
    </div>
  )
}
