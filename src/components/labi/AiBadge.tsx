/** Marks words written by the AI model, as opposed to Labi's prepared lines. */
export default function AiBadge() {
  return (
    <>
      <span
        aria-hidden
        title="Jawaban ini dibuat oleh AI"
        className="mr-1.5 inline-block rounded bg-primary px-1 align-[1px] text-[10px] leading-4 font-bold text-white"
      >
        AI
      </span>
      <span className="sr-only">Jawaban AI: </span>
    </>
  )
}
