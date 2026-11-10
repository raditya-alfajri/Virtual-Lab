/** A small meter screen for assets whose drawing has no screen of its own. */
export default function ReadingDisplay({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-ink px-1.5 py-0.5 font-mono text-xs font-semibold whitespace-nowrap text-bg tabular-nums">
      {text}
    </span>
  )
}
