import clsx from 'clsx'
import type { StageView } from '../../simulations/types'

type Props = {
  views: StageView[]
  active: string
  /** The view holding what the guide points at, when it is not the open one. */
  flagged?: string
  onChange: (id: string) => void
}

/** The work areas of an upright phone: one part of the room at a time, enlarged. */
export default function StageViewTabs({
  views,
  active,
  flagged,
  onChange,
}: Props) {
  return (
    <div
      role="tablist"
      aria-label="Area kerja"
      className="flex gap-1 border-b border-line bg-white p-1"
    >
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          role="tab"
          aria-selected={view.id === active}
          onClick={() => onChange(view.id)}
          className={clsx(
            'relative min-h-10 min-w-0 flex-1 rounded-xl px-2 text-sm leading-tight font-semibold transition-colors',
            view.id === active
              ? 'bg-primary text-white'
              : 'text-ink-muted hover:bg-primary-tint hover:text-primary',
          )}
        >
          <span className="block truncate">{view.label}</span>
          {view.id === flagged && (
            <span className="absolute top-1.5 right-1.5 size-2 animate-pulse rounded-full bg-rose-500">
              <span className="sr-only">, langkah berikutnya ada di sini</span>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
