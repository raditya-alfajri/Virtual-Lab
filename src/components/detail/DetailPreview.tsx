import { Eye, Maximize2, Play } from 'lucide-react'
import { Link } from 'react-router'
import type { Experiment } from '../../data/types'
import type { Accent } from '../catalog/experimentMeta'
import { ScenePreview } from '../catalog/ScenePreview'

export function DetailPreview({
  exp,
  accent,
}: {
  exp: Experiment
  accent: Accent
}) {
  return (
    <Link
      to={`/lab/${exp.subject}/${exp.id}/mulai`}
      aria-label="Mulai eksperimen"
      className="group relative block aspect-video overflow-hidden rounded-3xl bg-ink"
    >
      <ScenePreview id={exp.id} topic={exp.topic} accent={accent} />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

      <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium">
        <Eye className={`size-3.5 ${accent.text}`} />
        Pratinjau lab virtual
      </span>
      <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium">
        <span className="size-1.5 rounded-full bg-green-500" />
        Interaktif
      </span>

      <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg transition-transform group-hover:scale-105">
        <Play className={`ml-0.5 size-6 fill-current ${accent.text}`} />
      </span>

      <div className="absolute inset-x-4 bottom-4 pr-12 text-white">
        <p className="font-heading font-semibold">Lab virtual: {exp.title}</p>
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
  )
}
