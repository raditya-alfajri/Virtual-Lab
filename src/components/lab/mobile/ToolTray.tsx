import type { Value } from '../../../data/types'
import type { Rect } from '../../../simulations/types'
import MiniAsset from './MiniAsset'

export type TrayEntry = {
  id: string
  kind: string
  name: string
  // Keterangan singkat di bawah nama (mis. isi tabung).
  detail?: string
  view?: Record<string, Value>
  home?: Rect
}

// Rak alat (mode HP): benda yang bisa diseret tetapi tidak terlihat di area
// aktif. Ketuk untuk memilih, atau sebagai tujuan benda yang sedang dipilih
// (mis. sendok ke wadah CuSO₄). Di bawah adegan, atau di kolom kiri saat
// lanskap.
export default function ToolTray({
  entries,
  selected,
  vertical = false,
  onTap,
}: {
  entries: TrayEntry[]
  selected: string | null
  vertical?: boolean
  onTap: (id: string) => void
}) {
  return (
    <section
      aria-label="Rak alat"
      className={`flex flex-col bg-white ${vertical ? 'min-h-0 flex-1' : 'h-[92px] shrink-0 border-t border-line'}`}
    >
      <h2
        aria-hidden
        className="px-3 pt-1.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase"
      >
        Rak alat
      </h2>
      {entries.length ? (
        <ul
          className={`flex min-h-0 flex-1 [scrollbar-width:none] gap-2 px-2 pb-1.5 ${vertical ? 'flex-col overflow-y-auto overscroll-y-contain pt-1' : 'items-center overflow-x-auto overscroll-x-contain'}`}
        >
          {entries.map((e) => {
            const active = e.id === selected
            return (
              <li key={e.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onTap(e.id)}
                  className={`flex h-16 items-center gap-1 rounded-xl border px-1.5 text-left transition-colors ${vertical ? 'w-full' : 'w-[104px]'} ${active ? 'border-primary bg-primary-tint text-primary' : 'border-line bg-bg text-ink'}`}
                >
                  <MiniAsset
                    kind={e.kind}
                    name={e.name}
                    view={e.view}
                    home={e.home}
                    size={32}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={`text-[11px] leading-tight font-medium ${e.detail ? 'line-clamp-2' : 'line-clamp-3'}`}
                    >
                      {e.name}
                    </span>
                    {e.detail && (
                      <span
                        className={`line-clamp-2 text-[10px] leading-tight ${active ? 'text-primary' : 'text-ink-muted'}`}
                      >
                        {e.detail}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="flex flex-1 items-start px-3 py-1.5 text-xs text-ink-muted">
          Semua alat ada di area ini.
        </p>
      )}
    </section>
  )
}
