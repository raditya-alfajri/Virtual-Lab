import { useState } from 'react'
import type { Column, Explanation, Row } from '../../../data/types'
import { ExplanationPanel, ObservationTable } from '../ObservationPanels'

type Tab = 'table' | 'explanation'

const TABS: { id: Tab; label: string }[] = [
  { id: 'table', label: 'Tabel' },
  { id: 'explanation', label: 'Penjelasan' },
]

// Tabel pengamatan dan Penjelasan dalam dua tab (mode HP).
export default function ResultsPanel({
  columns,
  rows,
  explanation,
  onRemove,
}: {
  columns: Column[]
  rows: Row[]
  explanation: Explanation | null
  onRemove: (index: number) => void
}) {
  const [tab, setTab] = useState<Tab>('table')
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Hasil praktikum"
        className="flex shrink-0 gap-1 px-3 pb-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-primary-tint text-primary' : 'text-ink-muted hover:text-primary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        aria-label={tab === 'table' ? 'Tabel pengamatan' : 'Penjelasan'}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3"
      >
        {tab === 'table' ? (
          <ObservationTable
            columns={columns}
            rows={rows}
            onRemove={onRemove}
            plain
          />
        ) : (
          <ExplanationPanel explanation={explanation} plain />
        )}
      </div>
    </div>
  )
}
