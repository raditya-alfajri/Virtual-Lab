import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  FlaskConical,
  Info,
  ListChecks,
  Monitor,
  Play,
  Signal,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import {
  ACCENT,
  EXPERIMENT_META,
  FALLBACK_ICON,
  TOPIC_ICON,
} from '../components/catalog/experimentMeta'
import { DETAIL_EXTRA, LAB_NAME } from '../components/detail/detailMeta'
import { DetailPreview } from '../components/detail/DetailPreview'
import { SectionCard } from '../components/detail/SectionCard'
import type { Experiment } from '../data/types'
import { getExperiment } from '../lib/experiments'

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
  const meta = EXPERIMENT_META[exp.id]
  const extra = DETAIL_EXTRA[exp.id]
  const TopicIcon = TOPIC_ICON[exp.topic.toLowerCase()] ?? FALLBACK_ICON

  const stats: { icon: LucideIcon; label: string; value: string }[] = meta
    ? [
        { icon: Clock, label: 'Durasi', value: meta.duration },
        { icon: Signal, label: 'Tingkat', value: meta.level },
        { icon: BookOpen, label: 'Mode', value: meta.mode },
      ]
    : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-8">
      <Link
        to={`/lab/${exp.subject}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {LAB_NAME[exp.subject]}
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <DetailPreview exp={exp} accent={accent} />

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

          {stats.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {stats.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-line bg-white p-3"
                >
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Icon className="size-3.5 shrink-0" />
                    {label}
                  </p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Link
              to={`/lab/${exp.subject}/${exp.id}/mulai`}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-semibold text-white ${accent.solid}`}
            >
              <Play className="size-4 fill-current" />
              Mulai eksperimen
            </Link>
            {extra && (
              <button
                type="button"
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
        </div>

        <div className="space-y-5">
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
                  {extra.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-4"
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-lg text-sm font-semibold ${accent.tint} ${accent.text}`}
                      >
                        {index + 1}
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
      </div>
    </div>
  )
}