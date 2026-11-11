import { useState } from 'react'
import { ArrowLeft, FlaskConical, Lightbulb } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { SearchBox, TopicChips } from '../components/catalog/CatalogControls'
import {
  ComingSoonCard,
  ExperimentCard,
} from '../components/catalog/ExperimentCard'
import {
  ACCENT,
  COMING_SOON,
  type Subject,
} from '../components/catalog/experimentMeta'
import { ScenePreview } from '../components/catalog/ScenePreview'
import {
  filterByTopic,
  getExperiments,
  getTopics,
  searchExperiments,
} from '../lib/experiments'

const SUBJECTS: Record<Subject, { name: string; subtitle: string }> = {
  kimia: {
    name: 'Laboratorium Kimia',
    subtitle:
      'Dari perubahan warna hingga reaksi zat. Yuk, buktikan konsep kimia lewat eksperimen!',
  },
  fisika: {
    name: 'Laboratorium Fisika',
    subtitle: 'Uji konsep dan temukan cara dunia bekerja.',
  },
}

const isSubject = (value?: string): value is Subject =>
  value === 'kimia' || value === 'fisika'

export default function ExperimentCatalog() {
  const { subject } = useParams()

  if (!isSubject(subject)) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-center">
        <h1 className="font-heading text-2xl font-bold">
          Laboratorium tidak ditemukan
        </h1>
        <p className="text-ink-muted">Pilih laboratorium dari halaman utama.</p>
        <Link
          to="/lab"
          className="inline-block rounded-xl bg-primary px-4 py-2 text-white"
        >
          Kembali ke laboratorium
        </Link>
      </div>
    )
  }

  // key membuat pencarian dan filter kembali kosong saat pindah laboratorium.
  return <Catalog key={subject} subject={subject} />
}

function Catalog({ subject }: { subject: Subject }) {
  const [keyword, setKeyword] = useState('')
  const [topic, setTopic] = useState<string | null>(null)

  const info = SUBJECTS[subject]
  const accent = ACCENT[subject]
  const all = getExperiments(subject)
  const topics = getTopics(all)
  const results = filterByTopic(searchExperiments(all, keyword), topic)

  const k = keyword.trim().toLowerCase()
  const soon = (COMING_SOON[subject] ?? []).filter(
    (item) =>
      !all.some((exp) => exp.id === item.id) &&
      (!topic || item.topic === topic) &&
      (!k ||
        item.title.toLowerCase().includes(k) ||
        item.summary.toLowerCase().includes(k)),
  )

  const first = all[0]
  const isEmpty = results.length === 0 && soon.length === 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-4 md:px-6 md:py-8">
      <Link
        to="/lab"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Semua pelajaran
      </Link>

      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl">
          {info.name}
        </h1>
        <p className="max-w-2xl text-ink-muted">{info.subtitle}</p>
      </header>

      <div
        className={`relative aspect-[2/1] overflow-hidden rounded-3xl md:aspect-[3/1] ${accent.tint}`}
      >
        {first && (
          <ScenePreview id={first.id} topic={first.topic} accent={accent} />
        )}
        <span className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold shadow-sm">
          <FlaskConical className={`size-4 ${accent.text}`} />
          {all.length} eksperimen siap dicoba
        </span>
      </div>

      <div className="space-y-4">
        <SearchBox value={keyword} onChange={setKeyword} />
        <TopicChips
          topics={topics}
          active={topic}
          onChange={setTopic}
          accent={accent}
        />
      </div>

      <section aria-labelledby="daftar-eksperimen" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="daftar-eksperimen"
            className="font-heading text-xl font-bold md:text-2xl"
          >
            Pilih eksperimen
          </h2>
          <span className="text-sm text-ink-muted">
            {results.length} eksperimen
          </span>
        </div>

        {isEmpty ? (
          <div className="space-y-3 rounded-3xl border border-dashed border-line bg-white p-8 text-center">
            <p className="font-heading text-lg font-semibold">
              Eksperimen tidak ditemukan
            </p>
            <p className="text-sm text-ink-muted">
              Coba kata kunci lain, atau pilih topik Semua.
            </p>
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                setTopic(null)
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${accent.solid}`}
            >
              Hapus pencarian
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} />
            ))}
            {soon.map((item) => (
              <ComingSoonCard key={item.id} item={item} subject={subject} />
            ))}
          </div>
        )}
      </section>

      {first && (
        <aside className={`flex gap-3 rounded-3xl p-5 ${accent.tint}`}>
          <Lightbulb className={`mt-0.5 size-5 shrink-0 ${accent.text}`} />
          <div className="space-y-1">
            <p className="font-semibold">Mulai dari yang sederhana</p>
            <p className="text-sm text-ink-muted">
              Coba {first.title} untuk mengenal alat dan langkah praktikum
              pertamamu.
            </p>
          </div>
        </aside>
      )}
    </div>
  )
}
