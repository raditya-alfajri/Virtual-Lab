import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useCallback } from 'react'
import type { ItemDef, ItemView } from '../../../data/types'
import { SHELF } from '../../../lib/engine'
import type { Rect } from '../../../simulations/types'
import type { DropData } from '../drop-target'
import LabAsset from '../LabAsset'
import {
  RACK_ITEM_ATTRIBUTE,
  rackDragId,
  SHELF_DROP,
  SHELF_NAME,
  type RackDragData,
} from '../use-bench-controls'

const THUMB_PX = 32

type Props = {
  items: ItemDef[]
  homes: Record<string, Rect>
  views: Record<string, ItemView>
  selectedId: string | null
  /** The rack items a dragged item can be dropped on. */
  targetIds: ReadonlySet<string>
  /** An item is held, so the rack is a place to put it back. */
  highlight: boolean
  onItemClick: (itemId: string) => void
  onReturn: () => void
}

/**
 * The movable items the active area does not show. A tool can be tapped to
 * pick it, pulled up onto the stage, or have an item dropped on it. Tapping
 * or dropping on the rack itself puts the item back where it started.
 */
export default function ToolRack({
  items,
  homes,
  views,
  selectedId,
  targetIds,
  highlight,
  onItemClick,
  onReturn,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: SHELF, data: SHELF_DROP })
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={SHELF_NAME}
      onClick={onReturn}
      className={clsx(
        'flex h-[84px] shrink-0 items-center gap-2 overflow-x-auto border-t px-3 transition-colors',
        isOver
          ? 'border-primary bg-primary-tint'
          : highlight
            ? 'border-primary/60 bg-primary-tint/60'
            : 'border-line bg-bg',
      )}
    >
      {items.length === 0 && (
        <p className="px-1 text-sm text-ink-muted">
          {highlight
            ? 'Ketuk rak alat untuk mengembalikan benda ke tempat awal.'
            : 'Semua alat yang bisa dipindah ada di area ini.'}
        </p>
      )}
      {items.map((item) => (
        <RackButton
          key={item.id}
          item={item}
          home={homes[item.id]}
          view={views[item.id]}
          selected={item.id === selectedId}
          droppable={targetIds.has(item.id)}
          onClick={onItemClick}
        />
      ))}
    </div>
  )
}

function RackButton({
  item,
  home,
  view,
  selected,
  droppable,
  onClick,
}: {
  item: ItemDef
  home?: Rect
  view?: ItemView
  selected: boolean
  droppable: boolean
  onClick: (itemId: string) => void
}) {
  const id = rackDragId(item.id)
  const dragData: RackDragData = { itemId: item.id }
  const dropData: DropData = { layer: 'item', itemId: item.id }
  const drag = useDraggable({ id, data: dragData })
  const drop = useDroppable({ id, data: dropData, disabled: !droppable })
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
    <button
      ref={setNodeRef}
      {...drag.listeners}
      {...drag.attributes}
      {...{ [RACK_ITEM_ATTRIBUTE]: '' }}
      type="button"
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation()
        onClick(item.id)
      }}
      className={clsx(
        'flex h-[72px] w-18 shrink-0 touch-pan-x flex-col items-center justify-center gap-0.5 rounded-xl border px-1',
        !drop.isOver && 'bg-white',
        selected || drop.isOver
          ? 'border-primary ring-2 ring-primary'
          : 'border-line',
        drop.isOver && 'bg-primary-tint',
        drag.isDragging && 'opacity-30',
      )}
    >
      <Thumbnail item={item} home={home} view={view} />
      <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-medium break-words">
        {item.name}
      </span>
    </button>
  )
}

function Thumbnail({
  item,
  home,
  view,
}: {
  item: ItemDef
  home?: Rect
  view?: ItemView
}) {
  if (!home) return <div className="size-8" />
  const fit = Math.min(THUMB_PX / home.w, THUMB_PX / home.h)
  return (
    <div aria-hidden className="pointer-events-none relative size-8">
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: home.w,
          height: home.h,
          transform: `translate(-50%, -50%) scale(${fit})`,
        }}
      >
        <LabAsset
          kind={item.kind}
          name={item.name}
          view={{ ...view, label: undefined, reading: undefined }}
          showReading={false}
        />
      </div>
    </div>
  )
}
