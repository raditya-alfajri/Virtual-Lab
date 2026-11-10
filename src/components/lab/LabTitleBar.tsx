import clsx from 'clsx'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useId } from 'react'
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

export default function LabTitleBar({
  experiment,
  speed,
  onSpeedChange,
  onReset,
}: Props) {
  const speedLabelId = useId()
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <Link
        to={`/lab/${experiment.subject}/${experiment.id}`}
        aria-label="Kembali ke detail praktikum"
        className="-ml-1.5 rounded-lg p-1.5 text-ink-muted hover:bg-primary-tint hover:text-ink"
      >
        <ArrowLeft size={22} />
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-heading text-2xl font-bold">
        {experiment.title}
      </h1>
      <div
        role="group"
        aria-labelledby={speedLabelId}
        className="flex items-center gap-1 rounded-full border border-line bg-white py-1 pr-1 pl-4"
      >
        <span id={speedLabelId} className="mr-1 text-sm text-ink-muted">
          Kecepatan
        </span>
        {SPEEDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={speed === option}
            onClick={() => onSpeedChange(option)}
            className={clsx(
              'rounded-full px-3 py-0.5 text-sm font-semibold',
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
        className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold hover:bg-primary-tint"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  )
}
