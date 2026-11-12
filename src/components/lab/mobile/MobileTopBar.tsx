import clsx from 'clsx'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Experiment } from '../../../data/types'
import type { Speed } from '../../../hooks/useExperiment'

type Props = {
  experiment: Experiment
  speed: Speed
  onSpeedChange: (speed: Speed) => void
  onReset: () => void
  /** Extra controls between the title and the speed switch. */
  children?: ReactNode
}

const SPEEDS: Speed[] = [1, 5]

export default function MobileTopBar({
  experiment,
  speed,
  onSpeedChange,
  onReset,
  children,
}: Props) {
  return (
    <header className="flex shrink-0 items-center gap-1 border-b border-line bg-bg px-1 py-0.5">
      <Link
        to={`/lab/${experiment.subject}/${experiment.id}`}
        aria-label="Kembali ke detail praktikum"
        className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-primary-tint hover:text-ink"
      >
        <ArrowLeft size={22} />
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-heading text-base font-bold">
        {experiment.title}
      </h1>
      {children}
      <div
        role="group"
        aria-label="Kecepatan"
        className="flex shrink-0 items-center rounded-full border border-line bg-white"
      >
        {SPEEDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={speed === option}
            onClick={() => onSpeedChange(option)}
            className={clsx(
              'h-11 min-w-11 rounded-full px-2 text-sm font-semibold',
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
        className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-primary-tint hover:text-ink"
      >
        <RotateCcw size={20} />
      </button>
    </header>
  )
}
