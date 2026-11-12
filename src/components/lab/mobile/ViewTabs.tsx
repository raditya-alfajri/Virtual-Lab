import clsx from 'clsx'
import type { MobileView } from '../../../simulations/types'

type Props = {
  views: MobileView[]
  activeId: string
  onChange: (viewId: string) => void
  className?: string
}

export default function ViewTabs({
  views,
  activeId,
  onChange,
  className,
}: Props) {
  return (
    <div
      role="group"
      aria-label="Area kerja"
      className={clsx('flex gap-1 overflow-x-auto', className)}
    >
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          aria-pressed={view.id === activeId}
          onClick={() => onChange(view.id)}
          className={clsx(
            'h-11 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap',
            view.id === activeId
              ? 'bg-primary-tint text-primary'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {view.name}
        </button>
      ))}
    </div>
  )
}
