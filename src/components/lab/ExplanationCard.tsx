import clsx from 'clsx'
import { ChevronUp, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import type { Explanation } from '../../data/types'
import type { PanelCorner } from '../../simulations/types'

type Props = {
  explanation: Explanation | null
  objectives: string[]
  tips: string[]
  corner: PanelCorner
}

const INTRO = {}
const MAX_TIPS = 2

export default function ExplanationCard({
  explanation,
  objectives,
  tips,
  corner,
}: Props) {
  const content: object = explanation ?? INTRO
  // Remembering what was collapsed (not just a flag) reopens the card on its
  // own as soon as a new explanation arrives.
  const [collapsedFor, setCollapsedFor] = useState<object | null>(null)
  const side = corner === 'top-left' ? 'left-3' : 'right-3'

  if (collapsedFor === content) {
    return (
      <button
        type="button"
        onClick={() => setCollapsedFor(null)}
        className={clsx(
          'pointer-events-auto absolute top-3 flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold shadow-md hover:bg-primary-tint',
          side,
        )}
      >
        <Lightbulb size={16} className="text-primary" />
        Penjelasan
      </button>
    )
  }

  const title = explanation ? 'Penjelasan' : 'Tujuan praktikum'
  return (
    <section
      aria-label={title}
      className={clsx(
        'pointer-events-auto absolute top-3 flex max-h-[calc(100%-6rem)] w-80 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl border border-line bg-bg/95 shadow-lg',
        side,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line py-2 pr-2 pl-4">
        <h2 className="flex items-center gap-2 font-heading text-sm font-bold">
          <Lightbulb size={16} className="text-primary" />
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setCollapsedFor(content)}
          aria-label="Ciutkan"
          className="rounded-md p-1 text-ink-muted hover:bg-primary-tint hover:text-ink"
        >
          <ChevronUp size={16} />
        </button>
      </header>
      <div className="overflow-y-auto px-4 py-3 text-sm leading-relaxed">
        {explanation ? (
          <>
            <p className="font-semibold">{explanation.result}</p>
            <p className="mt-1.5 text-ink-muted">{explanation.reason}</p>
            {explanation.formula && (
              <p className="mt-3 rounded-lg bg-primary-tint px-3 py-2 font-medium">
                {explanation.formula}
              </p>
            )}
          </>
        ) : (
          <>
            <ul className="list-disc space-y-1 pl-4">
              {objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
            {tips.length > 0 && (
              <>
                <h3 className="mt-3 font-semibold">Tips</h3>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-muted">
                  {tips.slice(0, MAX_TIPS).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
