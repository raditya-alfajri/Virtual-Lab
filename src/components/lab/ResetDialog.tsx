import { useId } from 'react'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ResetDialog({ open, onCancel, onConfirm }: Props) {
  const titleId = useId()
  const descriptionId = useId()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[4000] grid place-items-center bg-ink/40 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}
        className="w-full max-w-sm rounded-2xl bg-bg p-5 shadow-xl"
      >
        <h2 id={titleId} className="font-heading text-lg font-bold">
          Reset praktikum?
        </h2>
        <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
          Semua data di tabel akan terhapus dan meja lab kembali seperti awal.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-primary-tint"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-bg hover:brightness-110"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
