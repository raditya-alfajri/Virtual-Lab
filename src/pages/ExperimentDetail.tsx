import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  Droplets,
  Eye,
  FlaskConical,
  Gauge,
  Info,
  ListChecks,
  Maximize2,
  Monitor,
  Play,
  Signal,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import type { Experiment } from '../data/types'
import { getExperiment } from '../lib/experiments'

// Kelas ditulis utuh supaya terbaca oleh Tailwind.
const ACCENT = {
  kimia: { text: 'text-primary', tint: 'bg-primary-tint' },
  fisika: { text: 'text-fisika', tint: 'bg-fisika-tint' },
}
type Accent = (typeof ACCENT)[Experiment['subject']]

const SUBJECT = {
  kimia: { name: 'Laboratorium Kimia', icon: Droplets },
  fisika: { name: 'Laboratorium Fisika', icon: Gauge },
}

// TODO(BE): field ini belum ada di tipe Experiment. Pindahkan ke data
// eksperimen (types.ts + data/*) lalu hapus tabel sementara ini.
type Extra = {
  duration: string
  level: string
  mode: string
  materials: string[]
  steps: string[]
}

const EXTRA: Record<string, Extra> = {
  'uji-asam-basa': {
    duration: '10 menit',
    level: 'Pemula',
    mode: 'Panduan',
    materials: [
      'Tabung reaksi',
      'Indikator universal',
      'Pipet tetes',
      'Skala pH',
      'Larutan uji',
    ],
    steps: [
      'Pilih larutan yang ingin diuji',
      'Teteskan indikator ke tabung reaksi',
      'Amati perubahan warnanya',
      'Catat nilai pH di tabel hasil',
    ],
  },
}

export default function ExperimentDetail() {
  const { subject, id } = useParams()
  const exp = subject && id ? getExperiment(subject, id) : undefined

  if (!exp) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-center">
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

  return <Detail exp={exp} />
}

function Detail({ exp }: { exp: Experiment }) {
  const accent = ACCENT[exp.subject]
  const subject = SUBJECT[exp.subject]
  const TopicIcon = subject.icon
  const extra = EXTRA[exp.id]
  const startPath = `/lab/${exp.subject}/${exp.id}/mulai`

  const infos: { icon: LucideIcon; label: string; value: string }[] = extra
    ? [
        { icon: Clock, label: 'Durasi', value: extra.duration },
        { icon: Signal, label: 'Tingkat', value: extra.level },
        { icon: BookOpen, label: 'Mode', value: extra.mode },
      ]
    : []

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 md:py-8">
      <Link
        to={`/lab/${exp.subject}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {subject.name}
      </Link>

      <Link
        to={startPath}
        aria-label="Mulai eksperimen"
        className="group relative block aspect-video overflow-hidden rounded-3xl bg-ink"
      >
        <img
          src={exp.previewImage}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium">
          <Eye className={`size-3.5 ${accent.text}`} />
          Pratinjau lab virtual
        </span>
        <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-green-500" />
          Interaktif 3D
        </span>
        <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg transition-transform group-hover:scale-105">
          <Play className={`ml-0.5 size-6 fill-current ${accent.text}`} />
        </span>
        <div className="absolute inset-x-4 bottom-4 pr-12 text-white">
          <p className="font-heading font-semibold">
            Lab virtual: {exp.title}
          </p>
          <p className="text-sm text-white/80">
            Tekan play untuk mulai bereksperimen
          </p>
        </div>
        <span
          aria-hidden
          className="absolute right-4 bottom-4 grid size-9 place-items-center rounded-xl bg-white/20 text-white backdrop-blur"
        >
          <Maximize2 className="size-4" />
        </span>
      </Link>

      <div className="space-y-3">
        <span
          className={`grid size-12 place-items-center rounded-2xl ${accent.tint} ${accent.text}`}
        >
          <TopicIcon className="size-6" />
        </span>
        <p
          className={`text-xs font-semibold tracking-wide uppercase ${accent.text}`}
        >
          {exp.topic}
        </p>
        <h1 className="font-heading text-3xl font-bold">{exp.title}</h1>
        <p className="text-ink-muted">{exp.summary}</p>
      </div>

      {infos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {infos.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-line bg-white p-3"
            >
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Icon className="size-3.5" />
                {label}
              </p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Link
          to={startPath}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-semibold text-white"
        >
          <Play className="size-4 fill-current" />
          Mulai eksperimen
        </Link>
        {extra && (
          <button
            onClick={() =>
              document
                .getElementById('langkah')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3.5 font-semibold"
          >
            <BookOpen className="size-4" />
            Lihat panduan praktikum
          </button>
        )}
        <p className="flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Monitor className="size-3.5" />
          Langsung di browser, tanpa instalasi
        </p>
      </div>

      <SectionCard icon={Info} title="Tentang eksperimen" accent={accent}>
        <p className="leading-relaxed text-ink-muted">{exp.description}</p>
      </SectionCard>

      <SectionCard icon={Target} title="Tujuan praktikum" accent={accent}>
        <ul className="space-y-3">
          {exp.objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${accent.tint} ${accent.text}`}
              >
                <Check className="size-3" />
              </span>
              {objective}
            </li>
          ))}
        </ul>
      </SectionCard>

      {extra && (
        <>
          <SectionCard
            icon={FlaskConical}
            title="Alat & bahan virtual"
            accent={accent}
          >
            <ul className="flex flex-wrap gap-2">
              {extra.materials.map((material) => (
                <li
                  key={material}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm"
                >
                  {material}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            id="langkah"
            icon={ListChecks}
            title="Langkah praktikum"
            accent={accent}
          >
            <ol className="space-y-3">
              {extra.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-4"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg text-sm font-semibold ${accent.tint} ${accent.text}`}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </SectionCard>
        </>
      )}

      {exp.tips.length > 0 && (
        <aside className={`flex gap-3 rounded-3xl p-5 ${accent.tint}`}>
          <Info className={`mt-0.5 size-5 shrink-0 ${accent.text}`} />
          <div className="space-y-1">
            <p className="font-semibold">Tips sebelum mulai</p>
            <ul className="space-y-1 text-sm text-ink-muted">
              {exp.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}

function SectionCard({
  id,
  icon: Icon,
  title,
  accent,
  children,
}: {
  id?: string
  icon: LucideIcon
  title: string
  accent: Accent
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-3xl border border-line bg-white p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`grid size-9 place-items-center rounded-xl ${accent.tint} ${accent.text}`}
        >
          <Icon className="size-4.5" />
        </span>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}