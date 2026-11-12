import clsx from 'clsx'
import { BookOpen, MessageCircle, Table2, Trash2, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import type { Column, Explanation, Row } from '../../data/types'
import { formatCell } from './format-cell'
import { FLOATING_CARD } from './floating-card'
import type { LabLayout } from './lab-layout'

export type PanelTab = 'labi' | 'explanation' | 'table'

type Props = {
  layout: LabLayout
  /** The open tab; null when the panel is closed and only its tabs show. */
  tab: PanelTab | null
  onTabChange: (tab: PanelTab | null) => void
  explanation: Explanation | null
  objectives: string[]
  tips: string[]
  columns: Column[]
  rows: Row[]
  onRemoveRow: (index: number) => void
  /** The conversation with Labi. */
  assistant: ReactNode
  /** Grows whenever Labi says something, to flag the tab when it is closed. */
  assistantActivity: number
}

const MAX_TIPS = 2

const TABS = [
  { id: 'explanation', label: 'Penjelasan', Icon: BookOpen },
  { id: 'table', label: 'Tabel', Icon: Table2 },
  { id: 'labi', label: 'Tanya Labi', Icon: MessageCircle },
] as const

/**
 * Everything beside the room, one thing at a time: the explanation, the
 * observation table or the chat with Labi. Floating over the room it stays
 * closed until a tab is picked, so the room is what the student sees first.
 */
export default function LabPanel({
  layout,
  tab,
  onTabChange,
  explanation,
  objectives,
  tips,
  columns,
  rows,
  onRemoveRow,
  assistant,
  assistantActivity,
}: Props) {
  const baseId = useId()
  const floating = layout !== 'stack'
  // What each tab showed when it was last open; a change since then is news.
  const stamps: Record<PanelTab, unknown> = {
    labi: assistantActivity,
    explanation,
    table: rows.length,
  }
  const [seen, setSeen] = useState(stamps)

  const open = (next: PanelTab | null) => {
    setSeen({
      ...seen,
      ...(tab && { [tab]: stamps[tab] }),
      ...(next && { [next]: stamps[next] }),
    })
    onTabChange(next)
  }

  return (
    <aside
      aria-label="Panel praktikum"
      className={clsx(
        'pointer-events-auto flex flex-col',
        floating
          ? clsx('max-h-full overflow-hidden', FLOATING_CARD)
          : 'h-full border-t border-line bg-white',
        floating && tab && 'w-full',
        // The chat needs a height of its own to scroll in a short window.
        layout === 'side' && tab === 'labi' && 'h-full',
      )}
    >
      <div
        className={clsx(
          'flex shrink-0 items-center gap-1 p-1.5',
          tab && 'border-b border-line',
        )}
      >
        <div
          role="tablist"
          aria-label="Bagian panel"
          className="flex min-w-0 flex-1 gap-1"
        >
          {TABS.map(({ id, label, Icon }) => {
            const fresh = id !== tab && seen[id] !== stamps[id]
            const count = id === 'table' && rows.length > 0 ? rows.length : null
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${id}`}
                aria-selected={tab === id}
                aria-controls={tab === id ? `${baseId}-panel` : undefined}
                onClick={() => open(floating && tab === id ? null : id)}
                className={clsx(
                  'relative flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors',
                  layout === 'side' ? 'px-2 text-[13px]' : 'px-2.5 text-sm',
                  !floating && 'flex-1',
                  tab === id
                    ? 'bg-primary-tint text-primary'
                    : 'text-ink-muted hover:bg-primary-tint/60 hover:text-ink',
                )}
              >
                {layout !== 'side' && <Icon size={16} className="shrink-0" />}
                <span className="truncate">
                  {layout === 'side' && id === 'labi' ? 'Labi' : label}
                </span>
                {count !== null && (
                  <span className="rounded-full bg-primary px-1.5 text-[11px] leading-[18px] text-white">
                    {count}
                  </span>
                )}
                {fresh && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500">
                    <span className="sr-only">, ada yang baru</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {floating && tab && (
          <button
            type="button"
            onClick={() => open(null)}
            aria-label="Tutup panel"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-primary-tint hover:text-ink"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {tab && (
        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${tab}`}
          className={clsx(
            'flex min-h-0 flex-1 flex-col text-sm leading-relaxed',
            tab === 'labi' ? 'p-3' : 'overflow-y-auto p-4',
          )}
        >
          {tab === 'labi' && assistant}
          {tab === 'explanation' && (
            <ExplanationContent
              explanation={explanation}
              objectives={objectives}
              tips={tips}
            />
          )}
          {tab === 'table' && (
            <TableContent
              columns={columns}
              rows={rows}
              onRemoveRow={onRemoveRow}
            />
          )}
        </div>
      )}
    </aside>
  )
}

function ExplanationContent({
  explanation,
  objectives,
  tips,
}: Pick<Props, 'explanation' | 'objectives' | 'tips'>) {
  if (!explanation) {
    return (
      <div className="space-y-4">
        <Part label="Tujuan praktikum">
          <ul className="list-disc space-y-1 pl-4">
            {objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </Part>
        {tips.length > 0 && (
          <Part label="Tips">
            <ul className="list-disc space-y-1 pl-4 text-ink-muted">
              {tips.slice(0, MAX_TIPS).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </Part>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {explanation.result && (
        <Part label="Hasil">
          <p className="font-semibold">{explanation.result}</p>
        </Part>
      )}
      {explanation.reason && (
        <Part label="Alasan">
          <p>{explanation.reason}</p>
        </Part>
      )}
      {explanation.formula && (
        <Part label="Rumus">
          <p className="rounded-lg bg-primary-tint px-3 py-2 font-mono text-[13px] whitespace-pre-line">
            {explanation.formula}
          </p>
        </Part>
      )}
    </div>
  )
}

function TableContent({
  columns,
  rows,
  onRemoveRow,
}: Pick<Props, 'columns' | 'rows' | 'onRemoveRow'>) {
  return (
    <>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-2 font-semibold">No.</th>
              {columns.map((column) => (
                <th key={column.key} className="py-2 pr-3 font-semibold">
                  {column.label}
                </th>
              ))}
              <th className="py-2">
                <span className="sr-only">Hapus</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-line last:border-0">
                <td className="py-2 pr-2 text-ink-muted">{index + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} className="py-2 pr-3">
                    {formatCell(row[column.key])}
                  </td>
                ))}
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(index)}
                    aria-label={`Hapus baris ${index + 1}`}
                    className="rounded-md p-2 text-ink-muted hover:bg-primary-tint hover:text-ink"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="pt-3 text-ink-muted">
          Belum ada data. Hasil pengukuran akan tercatat di sini.
        </p>
      )}
    </>
  )
}

function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </h3>
      {children}
    </section>
  )
}
