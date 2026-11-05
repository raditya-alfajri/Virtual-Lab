import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, RotateCcw, X } from 'lucide-react'
import LabScene from '../components/lab/LabScene'
import type { Column, Experiment, Explanation, Row, Value } from '../data/types'
import { useExperiment } from '../hooks/useExperiment'
import { getExperiment } from '../lib/experiments'
import { getSceneLayout } from '../simulations'
import type { SceneLayout } from '../simulations/types'

const SPEEDS = [1, 5]

const show = (v: Value) =>
  typeof v === 'number' ? String(v).replace('.', ',') : String(v)

export default function LabPage() {
  const { subject = '', id = '' } = useParams()
  const exp = getExperiment(subject, id)

  if (!exp) {
    const catalog =
      subject === 'kimia' || subject === 'fisika' ? `/lab/${subject}` : '/lab'
    return (
      <Notice
        title="Eksperimen tidak ditemukan"
        text="Tautan yang kamu buka tidak cocok dengan eksperimen mana pun."
        to={catalog}
        action="Kembali ke katalog"
      />
    )
  }

  const layout = getSceneLayout(exp.id)
  if (!layout) {
    return (
      <Notice
        title={exp.title}
        text="Tampilan lab sedang disiapkan. Coba lagi nanti, ya."
        to={`/lab/${exp.subject}/${exp.id}`}
        action="Kembali ke detail eksperimen"
      />
    )
  }

  return <Lab key={exp.id} exp={exp} layout={layout} />
}

function Lab({ exp, layout }: { exp: Experiment; layout: SceneLayout }) {
  const [speed, setSpeed] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const lab = useExperiment(exp, speed)

  const reset = () => {
    lab.reset()
    setSelected(null)
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
        <div className="min-w-0 space-y-3">
          <header className="flex flex-wrap items-center gap-2">
            <Link
              to={`/lab/${exp.subject}/${exp.id}`}
              aria-label="Kembali ke detail eksperimen"
              className="rounded-full p-1.5 text-ink-muted hover:bg-primary-tint hover:text-primary"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="mr-auto font-heading text-xl font-bold md:text-2xl">
              {exp.title}
            </h1>
            <div
              role="group"
              aria-label="Kecepatan waktu"
              className="flex items-center gap-1 rounded-full border border-line bg-white p-1 text-sm"
            >
              <span className="px-2 text-ink-muted">Kecepatan</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  aria-pressed={s === speed}
                  className={`rounded-full px-3 py-0.5 font-medium ${s === speed ? 'bg-primary text-white' : 'text-ink hover:bg-primary-tint'}`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </header>

          <LabScene
            exp={exp}
            lab={lab}
            layout={layout}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <aside className="space-y-4">
          <ExplanationPanel explanation={lab.explanation} />
          <ObservationTable
            columns={lab.columns}
            rows={lab.observationRows}
            onRemove={lab.removeRow}
          />
        </aside>
      </div>
    </div>
  )
}

function ExplanationPanel({
  explanation,
}: {
  explanation: Explanation | null
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 text-sm">
      <h2 className="mb-2 font-heading text-base font-semibold">Penjelasan</h2>
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

function ObservationTable({
  columns,
  rows,
  onRemove,
}: {
  columns: Column[]
  rows: Row[]
  onRemove: (index: number) => void
}) {
  return (
    <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 text-sm">
      <h2 className="mb-2 font-heading text-base font-semibold">
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
                  className="rounded p-1 text-ink-muted hover:bg-primary-tint hover:text-primary"
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

function Notice({
  title,
  text,
  to,
  action,
}: {
  title: string
  text: string
  to: string
  action: string
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      <p className="text-ink-muted">{text}</p>
      <Link
        to={to}
        className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        {action}
      </Link>
    </div>
  )
}
