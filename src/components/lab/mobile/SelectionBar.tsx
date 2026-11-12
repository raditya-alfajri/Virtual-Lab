type Props = {
  name: string
  onCancel: () => void
  onReturn: () => void
}

export default function SelectionBar({ name, onCancel, onReturn }: Props) {
  return (
    <div
      role="status"
      className="pointer-events-auto absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-2xl bg-ink py-1 pr-1 pl-4 text-bg shadow-lg"
    >
      <p className="min-w-0 flex-1 text-sm leading-tight">
        <span className="block truncate font-semibold">{name}</span>
        <span className="block truncate text-bg/70">Ketuk tujuannya.</span>
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="h-11 shrink-0 rounded-xl px-3 text-sm font-semibold hover:bg-bg/15"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onReturn}
        className="h-11 shrink-0 rounded-xl bg-bg px-3 text-sm font-semibold text-ink"
      >
        Kembalikan
      </button>
    </div>
  )
}
