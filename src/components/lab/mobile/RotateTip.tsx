import { Smartphone, X } from 'lucide-react'
import { useState } from 'react'

const STORAGE_KEY = 'virtual-lab:rotate-tip-closed'

function readClosed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Shown on an upright phone until the student closes it once. */
export default function RotateTip() {
  const [closed, setClosed] = useState(readClosed)
  if (closed) return null

  const close = () => {
    setClosed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Without storage the tip simply comes back next time.
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line bg-primary-tint py-0.5 pr-0.5 pl-3 text-sm text-ink">
      <Smartphone size={18} className="shrink-0 rotate-90 text-primary" />
      <p className="min-w-0 flex-1">
        Putar HP-mu untuk meja kerja yang lebih luas.
      </p>
      <button
        type="button"
        onClick={close}
        aria-label="Tutup petunjuk"
        className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:text-ink"
      >
        <X size={18} />
      </button>
    </div>
  )
}
