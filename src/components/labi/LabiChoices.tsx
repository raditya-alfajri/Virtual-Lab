type Props = {
  choices: string[]
  onChoose: (choice: string) => void
}

/** Answers to Labi's question, as buttons. */
export default function LabiChoices({ choices, onChoose }: Props) {
  if (choices.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          onClick={() => onChoose(choice)}
          className="rounded-full border border-primary/40 bg-primary-tint px-3 py-1 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {choice}
        </button>
      ))}
    </div>
  )
}
