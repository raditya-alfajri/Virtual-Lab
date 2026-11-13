import clsx from 'clsx'
import type { ItemDef, ItemView } from '../../data/types'
import type { Rect } from '../../simulations/types'
import LabAsset from './LabAsset'

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
 * The tools outside the work area on screen, so they stay within reach: a tap
 * picks one up, or puts what is held onto it.
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
          'Alat lain · ketuk untuk mengambil'
        )}
      </p>
      <ul className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto overscroll-x-contain px-2 pt-1 pb-1.5">
        {entries.map(({ item, home, view }) => {
          const k = Math.min(THUMB / home.w, THUMB / home.h)
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={item.id === selected}
                onClick={() => onTap(item.id)}
                className={clsx(
                  'flex h-12 max-w-[124px] items-center gap-1.5 rounded-xl border px-1.5 text-left transition-colors',
                  item.id === selected
                    ? 'border-primary bg-primary-tint text-primary'
                    : 'border-line bg-bg text-ink',
                  item.id === pointed &&
                    item.id !== selected &&
                    'ring-2 ring-primary/70',
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
            </li>
          )
        })}
      </ul>
    </section>
  )
}
