import { Clock } from 'lucide-react'
import { Link } from 'react-router'
import type { Experiment } from '../../data/types'
import {
  ACCENT,
  EXPERIMENT_META,
  FALLBACK_ICON,
  TOPIC_ICON,
  type ComingSoon,
  type Subject,
} from './experimentMeta'

function CardHeader({
  subject,
  topic,
  title,
}: {
  subject: Subject
  topic: string
  title: string
}) {
  const accent = ACCENT[subject]
  const Icon = TOPIC_ICON[topic.toLowerCase()] ?? FALLBACK_ICON
  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accent.tint} ${accent.text}`}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold tracking-wide uppercase ${accent.text}`}
        >
          {topic}
        </p>
        <h3 className="font-heading text-xl font-bold">{title}</h3>
      </div>
    </div>
  )
}

export function ExperimentCard({ exp }: { exp: Experiment }) {
  const meta = EXPERIMENT_META[exp.id]

  return (
    <Link
      to={`/lab/${exp.subject}/${exp.id}`}
      className="block rounded-3xl border border-line bg-white p-5 transition hover:border-primary/40 hover:shadow-sm"
    >
      <CardHeader subject={exp.subject} topic={exp.topic} title={exp.title} />
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
        {exp.summary}
      </p>
      {meta && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {meta.duration}
          </span>
          <span className="text-right">
            {meta.level} · Dengan {meta.mode.toLowerCase()}
          </span>
        </div>
      )}
    </Link>
  )
}

export function ComingSoonCard({
  item,
  subject,
}: {
  item: ComingSoon
  subject: Subject
}) {
  return (
    <div
      aria-disabled="true"
      className="rounded-3xl border border-line bg-white p-5 opacity-70"
    >
      <CardHeader subject={subject} topic={item.topic} title={item.title} />
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
        {item.summary}
      </p>
      <div className="mt-4">
        <span className="inline-block rounded-full border border-line bg-bg px-3 py-1 text-xs font-medium text-ink-muted">
          Segera hadir
        </span>
      </div>
    </div>
  )
}