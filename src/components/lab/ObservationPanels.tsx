import { X } from 'lucide-react'
import type { Column, Explanation, Row, Value } from '../../data/types'

const show = (v: Value) =>
  typeof v === 'number' ? String(v).replace('.', ',') : String(v)

// `plain`: tanpa kartu dan judul, untuk panel bawah di mode HP yang sudah
// punya tab Tabel/Penjelasan.
export function ExplanationPanel({
  explanation,
  plain = false,
}: {
  explanation: Explanation | null
  plain?: boolean
}) {
  return (
    <section
      className={
        plain
          ? 'text-sm'
          : 'rounded-2xl border border-line bg-white p-4 text-sm'
      }
    >
      <h2
        className={
          plain ? 'sr-only' : 'mb-2 font-heading text-base font-semibold'
        }
      >
        Penjelasan
      </h2>
      {explanation ? (
        <div className="space-y-2">
          <p className="font-semibold">{explanation.result}</p>
          <p>{explanation.reason}</p>
          {explanation.formula && (
            <p className="rounded-lg bg-primary-tint px-3 py-2 font-mono text-primary">
              {explanation.formula}
            </p>
          )}
        </div>
      ) : (
        <p className="text-ink-muted">
          Penjelasan muncul setelah kamu melakukan pengukuran.
        </p>
      )}
    </section>
  )
}

export function ObservationTable({
  columns,
  rows,
  onRemove,
  plain = false,
}: {
  columns: Column[]
  rows: Row[]
  onRemove: (index: number) => void
  plain?: boolean
}) {
  return (
    <section
      className={
        plain
          ? 'overflow-x-auto text-sm'
          : 'overflow-x-auto rounded-2xl border border-line bg-white p-4 text-sm'
      }
    >
      <h2
        className={
          plain ? 'sr-only' : 'mb-2 font-heading text-base font-semibold'
        }
      >
        Tabel pengamatan
      </h2>
      <table className="w-full">
        <thead>
          <tr className="text-left text-ink-muted">
            {columns.map((c) => (
              <th key={c.key} className="pr-3 pb-1 font-medium">
                {c.label}
              </th>
            ))}
            <th>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {columns.map((c) => (
                <td key={c.key} className="py-1.5 pr-3">
                  {show(row[c.key])}
                </td>
              ))}
              <td className="text-right">
                <button
                  onClick={() => onRemove(i)}
                  aria-label={`Hapus baris ${i + 1}`}
                  className={
                    plain
                      ? 'inline-grid size-11 place-items-center rounded text-ink-muted hover:bg-primary-tint hover:text-primary'
                      : 'rounded p-1 text-ink-muted hover:bg-primary-tint hover:text-primary'
                  }
                >
                  <X size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="mt-2 text-ink-muted">
          Belum ada data. Hasil pengukuran akan tercatat di sini.
        </p>
      )}
    </section>
  )
}
