import clsx from 'clsx'
import { MessageCircle } from 'lucide-react'

type Props = {
  choices: string[]
  onChoose: (choice: string) => void
  /** Opens the chat, to type or say an answer of one's own. */
  onAnswerYourself?: () => void
  /** True while something is dragged: the buttons must not catch the pointer. */
  passive?: boolean
}

/** Answers to Labi's question, as buttons large enough for a finger. */
export default function LabiChoices({
  choices,
  onChoose,
  onAnswerYourself,
  passive,
}: Props) {
  if (choices.length === 0) return null
  return (
    <div
      className={clsx(
        'mt-2 flex flex-col items-start gap-0.5',
        passive ? 'pointer-events-none' : 'pointer-events-auto',
      )}
    >
      <div className="flex flex-wrap gap-1.5">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => onChoose(choice)}
            className="min-h-11 rounded-full border border-primary/40 bg-primary-tint px-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            {choice}
          </button>
        ))}
      </div>
      {onAnswerYourself && (
        <button
          type="button"
          onClick={onAnswerYourself}
          className="flex min-h-11 items-center gap-1 rounded-md px-1 text-xs font-semibold text-ink-muted transition-colors hover:text-primary"
        >
          <MessageCircle size={14} aria-hidden />
          Jawab sendiri
        </button>
      )}
    </div>
  )
}
