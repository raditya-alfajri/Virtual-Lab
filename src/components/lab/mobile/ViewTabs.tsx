import type { MobileView } from '../../../simulations/types'

// Tab area kerja (mode HP): di atas adegan, atau bertumpuk di kolom kiri saat
// lanskap.
export default function ViewTabs({
  views,
  active,
  panelId,
  vertical = false,
  onChange,
}: {
  views: MobileView[]
  active: string
  panelId: string
  vertical?: boolean
  onChange: (id: string) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Area kerja"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={`flex shrink-0 gap-1 border-line bg-white p-1 ${vertical ? 'flex-col border-b' : 'border-b'}`}
    >
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          aria-selected={v.id === active}
          aria-controls={panelId}
          onClick={() => onChange(v.id)}
          className={`min-h-11 flex-1 rounded-xl px-2 text-sm leading-tight font-semibold transition-colors ${v.id === active ? 'bg-primary text-white' : 'text-ink-muted hover:bg-primary-tint hover:text-primary'}`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
