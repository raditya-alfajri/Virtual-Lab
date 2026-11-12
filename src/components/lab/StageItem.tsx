import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useCallback, useRef, type PointerEvent } from 'react'
import type { ItemDef, ItemView } from '../../data/types'
import type { Placement, Point, Side } from '../../simulations/types'
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
  /** Set while the item is pulled instead of dragged; gets the pointer in stage coordinates. */
  pull?: (point: Point) => void
  onRelease: (itemId: string) => void
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
  pull,
  onRelease,
  onClick,
  onAction,
}: Props) {
  const fixed = item.fixed === true
  const drag = useDraggable({ id: item.id, disabled: fixed || !!pull })
  const gesture = useRef<{
    left: number
    top: number
    scale: number
    x0: number
    y0: number
    moved: boolean
  } | null>(null)
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

  // The pointer in stage coordinates, from the item's box when the pull starts.
  const startPull = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const scale = box.width / rect.w
    if (!scale) return
    gesture.current = {
      left: box.left - rect.x * scale,
      top: box.top - rect.y * scale,
      scale,
      x0: e.clientX,
      y0: e.clientY,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const movePull = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || !pull) return
    if (!g.moved && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 5) return
    g.moved = true
    pull({
      x: (e.clientX - g.left) / g.scale,
      y: (e.clientY - g.top) / g.scale,
    })
  }

  const endPull = () => {
    const moved = gesture.current?.moved
    gesture.current = null
    if (moved) onRelease(item.id)
  }

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
        onPointerDown={pull && startPull}
        onPointerMove={pull && movePull}
        onPointerUp={pull && endPull}
        onPointerCancel={pull && endPull}
        {...(pull ? undefined : drag.listeners)}
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
            : pull
              ? 'cursor-ew-resize'
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
        // A moving item can keep its button still at `rect.action`.
        <div
          className={clsx(
            'pointer-events-none absolute',
            !rect.action && 'inset-0',
          )}
          style={
            rect.action && {
              left: rect.action.x - rect.x,
              top: rect.action.y - rect.y,
              width: rect.action.w,
              height: rect.action.h,
            }
          }
        >
          <button
            type="button"
            onClick={() => onAction(item.id)}
            className={clsx(
              'pointer-events-auto absolute rounded-full bg-primary px-3 py-1 text-sm font-semibold whitespace-nowrap text-bg shadow hover:brightness-110',
              ACTION_SIDE_CLASS[actionSide],
            )}
          >
            {view.action}
          </button>
        </div>
      )}
    </div>
  )
}
