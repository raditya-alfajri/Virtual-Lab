import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { Column, Explanation, Row } from '../../data/types'
import { formatCell } from './format-cell'
import { FLOATING_CARD } from './floating-card'

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
  return (
    <aside aria-label="Panel praktikum" className="flex flex-col gap-3">
      <Card title="Penjelasan">
        <ExplanationContent
          explanation={explanation}
          objectives={objectives}
          tips={tips}
        />
      </Card>
      <Card title="Tabel pengamatan">
        <TableContent columns={columns} rows={rows} onRemoveRow={onRemoveRow} />
      </Card>
      <Card title="Asisten Labi">
        <div className="min-h-32" />
      </Card>
    </aside>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className={clsx('shrink-0 p-5', FLOATING_CARD)}
    >
      <h2 id={titleId} className="font-heading text-lg font-bold">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </section>
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
                    className="rounded-md p-1.5 text-ink-muted hover:bg-primary-tint hover:text-ink"
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
