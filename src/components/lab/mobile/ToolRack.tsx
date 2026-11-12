import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { ItemDef, ItemView } from '../../../data/types'
import { SHELF } from '../../../lib/engine'
import type { Rect } from '../../../simulations/types'
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
  /** An item is held, so the rack is a place to put it back. */
  highlight: boolean
  onItemClick: (itemId: string) => void
  onReturn: () => void
}

/**
 * The movable items the active area does not show. A tool can be tapped to
 * pick it, or pulled up onto the stage. Tapping the rack itself puts the held
 * item back where it started.
 */
export default function ToolRack({
  items,
  homes,
  views,
  selectedId,
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
        'flex h-[76px] shrink-0 items-center gap-2 overflow-x-auto border-t px-3 transition-colors',
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
  onClick,
}: {
  item: ItemDef
  home?: Rect
  view?: ItemView
  selected: boolean
  onClick: (itemId: string) => void
}) {
  const data: RackDragData = { itemId: item.id }
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: rackDragId(item.id),
    data,
  })
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      {...{ [RACK_ITEM_ATTRIBUTE]: '' }}
      type="button"
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation()
        onClick(item.id)
      }}
      className={clsx(
        'flex h-15 w-18 shrink-0 touch-pan-x flex-col items-center justify-center gap-1 rounded-xl border bg-white px-1',
        selected ? 'border-primary ring-2 ring-primary' : 'border-line',
        isDragging && 'opacity-30',
      )}
    >
      <Thumbnail item={item} home={home} view={view} />
      <span className="w-full truncate text-center text-[11px] leading-tight font-medium">
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
