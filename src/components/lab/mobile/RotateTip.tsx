import { useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { markRotateTipSeen, rotateTipSeen } from './rotateTipStorage'

// Petunjuk sekali tampil di posisi potret. Tidak memaksa rotasi.
export default function RotateTip() {
  const [hidden, setHidden] = useState(rotateTipSeen)
  if (hidden) return null
  return (
    <div
      role="note"
      className="mx-2 mt-2 flex shrink-0 items-center gap-2 rounded-xl bg-primary-tint py-0.5 pr-0.5 pl-3 text-sm text-primary"
    >
      <Smartphone size={18} className="shrink-0 rotate-90" aria-hidden />
      <p className="flex-1 leading-tight">
        Putar HP-mu untuk meja kerja yang lebih luas.
      </p>
      <button
        type="button"
        aria-label="Tutup petunjuk"
        onClick={() => {
          markRotateTipSeen()
          setHidden(true)
        }}
        className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white/60"
      >
        <X size={18} />
      </button>
    </div>
  )
}
