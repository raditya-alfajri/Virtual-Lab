import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { ItemDef, ItemView } from '../../data/types'
import type { Rect } from '../../simulations/types'
import LabAsset from './LabAsset'
import { trayDragId } from './tray-drag'

export type TrayEntry = {
  item: ItemDef
  home: Rect
  view?: ItemView
}

type Props = {
  entries: TrayEntry[]
  selected: string | null
  /** The name of what is held, wherever it is. */
  selectedName: string | null
  /** The item the guide points at. */
  pointed?: string | null
  onTap: (itemId: string) => void
}

const THUMB = 34

/**
 * The tools outside the work area on screen, so they stay within reach: drag
 * one up onto its target, or tap it to pick it up and then tap the target.
 */
export default function ToolTray({
  entries,
  selected,
  selectedName,
  pointed,
  onTap,
}: Props) {
  return (
    <section
      aria-label="Alat di luar area ini"
      className="border-t border-line bg-white"
    >
      <p
        aria-live="polite"
        className="truncate px-3 pt-1.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase"
      >
        {selectedName ? (
          <span className="text-primary normal-case">
            {selectedName} dipilih. Ketuk tujuannya.
          </span>
        ) : (
          'Alat lain · seret ke atas atau ketuk'
        )}
      </p>
      <ul className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto overscroll-x-contain px-2 pt-1 pb-1.5">
        {entries.map((entry) => (
          <li key={entry.item.id} className="shrink-0">
            <TrayTool
              {...entry}
              selected={entry.item.id === selected}
              pointed={entry.item.id === pointed}
              onTap={onTap}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function TrayTool({
  item,
  home,
  view,
  selected,
  pointed,
  onTap,
}: TrayEntry & {
  selected: boolean
  pointed: boolean
  onTap: (itemId: string) => void
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: trayDragId(item.id),
  })
  const k = Math.min(THUMB / home.w, THUMB / home.h)
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-pressed={selected}
      onClick={() => onTap(item.id)}
      onContextMenu={(event) => event.preventDefault()}
      className={clsx(
        // Sideways stays a scroll of the tray; up is a drag.
        'flex h-12 max-w-[124px] touch-pan-x items-center gap-1.5 rounded-xl border px-1.5 text-left transition-colors select-none [-webkit-touch-callout:none]',
        isDragging && 'opacity-40',
        selected
          ? 'border-primary bg-primary-tint text-primary'
          : 'border-line bg-bg text-ink',
        pointed && !selected && 'ring-2 ring-primary/70',
      )}
    >
      <span
        aria-hidden
        className="grid shrink-0 place-items-center"
        style={{ width: THUMB, height: THUMB }}
      >
        <span
          className="block"
          style={{ width: home.w * k, height: home.h * k }}
        >
          <LabAsset
            kind={item.kind}
            name={item.name}
            view={{ ...view, label: undefined, reading: undefined }}
          />
        </span>
      </span>
      <span className="line-clamp-2 text-[11px] leading-tight font-medium">
        {item.name}
      </span>
    </button>
  )
}
