export default function AssetLabel({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute top-full left-1/2 mt-1.5 -translate-x-1/2 rounded-full border border-line bg-white px-2 py-0.5 text-xs leading-tight font-medium whitespace-nowrap text-ink shadow-sm">
      {text}
    </span>
  )
}
