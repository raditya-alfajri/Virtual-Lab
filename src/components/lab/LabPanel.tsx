import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import type { Column, Explanation, Row } from '../../data/types'
import { formatCell } from './format-cell'

type Tab = 'explanation' | 'table'

type Props = {
  explanation: Explanation | null
  objectives: string[]
  tips: string[]
  columns: Column[]
  rows: Row[]
  onRemoveRow: (index: number) => void
}

const MAX_TIPS = 2

export default function LabPanel({
  explanation,
  objectives,
  tips,
  columns,
  rows,
  onRemoveRow,
}: Props) {
  const baseId = useId()
  // A chosen tab only holds while the explanation it was chosen under is
  // still current, so a new explanation brings Penjelasan forward by itself.
  const [choice, setChoice] = useState<{
    tab: Tab
    explanation: Explanation | null
  }>({ tab: 'explanation', explanation })
  const activeTab =
    choice.explanation === explanation ? choice.tab : 'explanation'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'explanation', label: 'Penjelasan' },
    { id: 'table', label: `Tabel (${rows.length})` },
  ]

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-line bg-bg">
      <div
        role="tablist"
        aria-label="Panel praktikum"
        className="flex gap-1 border-b border-line px-3 pt-3"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${baseId}-${tab.id}-tab`}
            aria-selected={activeTab === tab.id}
            aria-controls={`${baseId}-${tab.id}`}
            onClick={() => setChoice({ tab: tab.id, explanation })}
            className={clsx(
              '-mb-px rounded-t-lg border-x border-t px-4 py-2 text-sm font-semibold',
              activeTab === tab.id
                ? 'border-line bg-bg text-ink'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-${activeTab}`}
        aria-labelledby={`${baseId}-${activeTab}-tab`}
        className="min-h-0 flex-1 overflow-auto p-4 text-sm leading-relaxed"
      >
        {activeTab === 'explanation' ? (
          <ExplanationContent
            explanation={explanation}
            objectives={objectives}
            tips={tips}
          />
        ) : (
          <TableContent
            columns={columns}
            rows={rows}
            onRemoveRow={onRemoveRow}
          />
        )}
      </div>
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
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-ink-muted">
        Belum ada data. Data tercatat saat kamu memakai alat ukur.
      </p>
    )
  }

  return (
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
                className="rounded-md p-1.5 text-ink-muted hover:bg-primary-tint hover:text-ink"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
