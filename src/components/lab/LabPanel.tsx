import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { Column, Explanation, Row } from '../../data/types'
import { formatCell } from './format-cell'

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
    <aside
      aria-label="Panel praktikum"
      className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:w-105 lg:overflow-y-auto"
    >
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
      className="shrink-0 rounded-2xl border border-line bg-white p-5"
    >
      <h2 id={titleId} className="font-heading text-lg font-bold">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

export function ExplanationContent({
  explanation,
  objectives,
  tips,
  large = false,
}: Pick<Props, 'explanation' | 'objectives' | 'tips'> & {
  /** Bigger text for the phone panel, where the card fills the width. */
  large?: boolean
}) {
  if (!explanation) {
    return (
      <div className="space-y-4">
        <Part label="Tujuan praktikum" large={large}>
          <ul className="list-disc space-y-1 pl-4">
            {objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </Part>
        {tips.length > 0 && (
          <Part label="Tips" large={large}>
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
        <Part label="Hasil" large={large}>
          <p className={clsx('font-semibold', large && 'text-lg leading-snug')}>
            {explanation.result}
          </p>
        </Part>
      )}
      {explanation.reason && (
        <Part label="Alasan" large={large}>
          <p>{explanation.reason}</p>
        </Part>
      )}
      {explanation.formula && (
        <Part label="Rumus" large={large}>
          <p
            className={clsx(
              'rounded-lg bg-primary-tint px-3 py-2 font-mono whitespace-pre-line',
              large ? 'text-[15px]' : 'text-[13px]',
            )}
          >
            {explanation.formula}
          </p>
        </Part>
      )}
    </div>
  )
}

export function TableContent({
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

function Part({
  label,
  large = false,
  children,
}: {
  label: string
  large?: boolean
  children: ReactNode
}) {
  return (
    <section>
      <h3
        className={clsx(
          'mb-1 font-semibold tracking-wide text-ink-muted uppercase',
          large ? 'text-[13px]' : 'text-xs',
        )}
      >
        {label}
      </h3>
      {children}
    </section>
  )
}
