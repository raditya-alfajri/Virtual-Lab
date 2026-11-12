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
  const compact = layout !== 'wide'
  const back = (
    <Link
      to={`/lab/${experiment.subject}/${experiment.id}`}
      aria-label="Kembali ke detail praktikum"
      className={clsx(
        'rounded-lg text-ink-muted hover:bg-primary-tint hover:text-ink',
        compact
          ? 'flex size-10 shrink-0 items-center justify-center'
          : '-ml-1.5 p-1.5',
      )}
    >
      <ArrowLeft size={22} />
    </Link>
  )
  const title = (
    <div className="min-w-0 flex-1">
      <p
        className={clsx(
          'truncate font-semibold tracking-wide uppercase',
          compact ? 'text-[11px]' : 'text-xs',
          experiment.subject === 'fisika' ? 'text-fisika' : 'text-primary',
        )}
      >
        {SUBJECT_NAME[experiment.subject]} · {experiment.topic}
      </p>
      <h1
        className={clsx(
          'truncate font-heading font-bold',
          compact ? 'text-base leading-tight' : 'text-xl',
        )}
      >
        {experiment.title}
      </h1>
    </div>
  )
  const speeds = (
    <div
      role="group"
      aria-labelledby={speedLabelId}
      className={clsx(
        'flex shrink-0 items-center gap-1 rounded-full border border-line bg-white',
        compact ? 'p-0.5' : 'py-1 pr-1 pl-4',
      )}
    >
      <span
        id={speedLabelId}
        className={compact ? 'sr-only' : 'mr-1 text-sm text-ink-muted'}
      >
        Kecepatan
      </span>
      {SPEEDS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={speed === option}
          onClick={() => onSpeedChange(option)}
          className={clsx(
            'rounded-full text-sm font-semibold',
            compact ? 'h-8 min-w-9 px-2' : 'px-3 py-0.5',
            speed === option
              ? 'bg-primary text-bg'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {option}×
        </button>
      ))}
    </div>
  )

  // Small screens: everything on one row, so the room keeps the height.
  if (compact) {
    return (
      <div
        className={clsx(
          'flex items-center gap-1.5 py-1.5 pr-2 pl-1',
          layout === 'stack' ? 'border-b border-line bg-white' : FLOATING_CARD,
        )}
      >
        {back}
        {title}
        {speeds}
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset praktikum"
          title="Reset"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-primary-tint"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col gap-3 p-4', FLOATING_CARD)}>
      <div className="flex items-start gap-2">
        {back}
        {title}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {speeds}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold hover:bg-primary-tint"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
    </div>
  )
}
