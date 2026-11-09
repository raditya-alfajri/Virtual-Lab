import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useCallback } from 'react'
import type { ItemDef, ItemView } from '../../data/types'
import type { Rect } from '../../simulations/types'
import type { DropData } from './drop-target'
import { onActivateKey } from './keyboard'
import LabAsset from './LabAsset'
import { useStageScale } from './stage-scale'

type Props = {
  item: ItemDef
  rect: Rect
  zIndex: number
  view?: ItemView
  selected: boolean
  onClick: (itemId: string) => void
  onAction: (itemId: string) => void
}

export default function StageItem({
  item,
  rect,
  zIndex,
  view,
  selected,
  onClick,
  onAction,
}: Props) {
  const scale = useStageScale()
  const fixed = item.fixed === true
  const drag = useDraggable({ id: item.id, disabled: fixed })
  const dropData: DropData = { layer: 'item', order: zIndex }
  const drop = useDroppable({ id: item.id, data: dropData })
  const { setNodeRef: setDragRef } = drag
  const { setNodeRef: setDropRef } = drop
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )

  const offset = drag.transform

  return (
    <div
      className="absolute"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: drag.isDragging ? 1000 : zIndex,
        // dnd-kit measures in screen pixels, but this lives inside the scaled stage.
        transform: offset
          ? `translate3d(${offset.x / scale}px, ${offset.y / scale}px, 0)`
          : undefined,
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
        <LabAsset kind={item.kind} name={item.name} view={view} />
      </div>
      {view?.action && (
        <button
          type="button"
          onClick={() => onAction(item.id)}
          className="absolute top-full left-1/2 mt-6 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm font-semibold whitespace-nowrap text-bg shadow hover:brightness-110"
        >
          {view.action}
        </button>
      )}
    </div>
  )
}
