import { Link, useParams } from 'react-router'
import type { Experiment } from '../data/types'
import { useExperiment } from '../hooks/useExperiment'
import { getExperiment } from '../lib/experiments'

export default function LabPage() {
  const { subject, id } = useParams();
  const exp = subject && id ? getExperiment(subject, id) : undefined;

  if (!exp) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 text-center">
        <h1 className="font-heading text-2xl font-bold">
          Eksperimen tidak ditemukan
        </h1>
        <p className="text-ink-muted">
          Periksa kembali alamat halaman, atau pilih eksperimen dari katalog.
        </p>
        <Link
          to="/lab"
          className="inline-block rounded-xl bg-primary px-4 py-2 text-white"
        >
          Kembali ke laboratorium
        </Link>
      </div>
    )
  }

  return <LabWorkspace key={exp.id} exp={exp} />
}

function LabWorkspace({ exp }: { exp: Experiment }) {
  const lab = useExperiment(exp)

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            to={`/lab/${exp.subject}/${exp.id}`}
            className="text-sm text-ink-muted hover:text-primary"
          >
            ← Kembali ke detail eksperimen
          </Link>
          <h1 className="font-heading text-2xl font-bold text-primary">
            {exp.title}
          </h1>
          <p className="text-sm text-ink-muted">{exp.topic}</p>
        </div>
        <button
          onClick={lab.reset}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium"
        >
          Reset
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-2 font-heading font-semibold">Meja kerja</h2>
            <p className="text-sm text-ink-muted">
              {exp.zones.length} area kerja siap dipasang (langkah 2).
            </p>
          </section>
          <section className="rounded-2xl border border-dashed border-line p-4">
            <h2 className="mb-2 font-heading font-semibold">
              Rak alat &amp; bahan
            </h2>
            <p className="text-sm text-ink-muted">
              {exp.items.length} alat dan bahan tersedia (langkah 2).
            </p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-2 font-heading font-semibold">Penjelasan</h2>
            <p className="text-sm text-ink-muted">
              {lab.explanation
                ? 'Ada penjelasan hasil (langkah 3).'
                : 'Penjelasan muncul setelah kamu mengukur.'}
            </p>
          </section>
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-2 font-heading font-semibold">
              Tabel pengamatan
            </h2>
            <p className="text-sm text-ink-muted">
              {lab.observationRows.length} baris data (langkah 3).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}