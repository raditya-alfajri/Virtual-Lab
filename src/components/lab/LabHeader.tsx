import clsx from 'clsx'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'
import type { Experiment } from '../../data/types'
import type { Speed } from '../../hooks/useExperiment'

type Props = {
  experiment: Experiment
  speed: Speed
  onSpeedChange: (speed: Speed) => void
  onReset: () => void
}

const SPEEDS: Speed[] = [1, 5]

export default function LabHeader({
  experiment,
  speed,
  onSpeedChange,
  onReset,
}: Props) {
  return (
    <header className="flex items-center gap-4 border-b border-line bg-bg px-4 py-2">
      <Link to="/" className="font-heading text-lg font-extrabold">
        virtual lab.
      </Link>
      <span aria-hidden className="h-6 w-px bg-line" />
      <Link
        to={`/lab/${experiment.subject}/${experiment.id}`}
        className="flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Kembali
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-bold">
        {experiment.title}
      </h1>
      <div
        role="group"
        aria-label="Kecepatan simulasi"
        className="flex rounded-lg border border-line p-0.5"
      >
        {SPEEDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={speed === option}
            onClick={() => onSpeedChange(option)}
            className={clsx(
              'rounded-md px-3 py-1 text-sm font-semibold',
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
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-primary-tint"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </header>
  )
}
