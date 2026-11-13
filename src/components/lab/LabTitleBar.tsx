import clsx from 'clsx'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router'
import type { Experiment } from '../../data/types'
import type { Speed } from '../../hooks/useExperiment'
import { FLOATING_CARD } from './floating-card'
import type { LabLayout } from './lab-layout'

type Props = {
  experiment: Experiment
  layout: LabLayout
  speed: Speed
  onSpeedChange: (speed: Speed) => void
  onReset: () => void
}

const SPEEDS: Speed[] = [1, 5]

const SUBJECT_NAME: Record<Experiment['subject'], string> = {
  kimia: 'Kimia',
  fisika: 'Fisika',
}

export default function LabTitleBar({
  experiment,
  layout,
  speed,
  onSpeedChange,
  onReset,
}: Props) {
  const speedLabelId = useId()
  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 py-1.5 pr-2 pl-1',
        layout === 'stack' ? 'border-b border-line bg-white' : FLOATING_CARD,
      )}
    >
      <Link
        to={`/lab/${experiment.subject}/${experiment.id}`}
        aria-label="Kembali ke detail praktikum"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-primary-tint hover:text-ink"
      >
        <ArrowLeft size={22} />
      </Link>
      <div className="mr-2 min-w-0 flex-1">
        <p
          className={clsx(
            'truncate text-[11px] font-semibold tracking-wide uppercase',
            experiment.subject === 'fisika' ? 'text-fisika' : 'text-primary',
          )}
        >
          {SUBJECT_NAME[experiment.subject]} · {experiment.topic}
        </p>
        <h1 className="truncate font-heading text-base leading-tight font-bold">
          {experiment.title}
        </h1>
      </div>
      <div
        role="group"
        aria-labelledby={speedLabelId}
        title="Kecepatan simulasi"
        className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-white p-0.5"
      >
        <span id={speedLabelId} className="sr-only">
          Kecepatan simulasi
        </span>
        {SPEEDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={speed === option}
            onClick={() => onSpeedChange(option)}
            className={clsx(
              'h-8 min-w-9 rounded-full px-2 text-sm font-semibold',
              speed === option
                ? 'bg-primary text-bg'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {option}×
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset praktikum"
        title="Ulangi dari awal"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-primary-tint"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  )
}
