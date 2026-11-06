import { Undo2, X } from 'lucide-react'
import { motion } from 'motion/react'
import type { TrayEntry } from './ToolTray'
import MiniAsset from './MiniAsset'

// Penanda benda yang sedang dipilih (mode HP), di bawah adegan. Pilihan tetap
// aktif saat berpindah area kerja.
export default function SelectionBar({
  item,
  onReturn,
  onCancel,
}: {
  item: TrayEntry
  // Tidak ada kalau benda sudah di rak alat & bahan.
  onReturn?: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-x-2 bottom-2 z-10 flex items-center gap-2 rounded-2xl bg-ink py-1 pr-1 pl-2 text-sm text-white shadow-lg"
    >
      <span className="rounded-lg bg-white p-0.5">
        <MiniAsset
          kind={item.kind}
          name={item.name}
          view={item.view}
          home={item.home}
          size={28}
        />
      </span>
      <p className="min-w-0 flex-1 leading-tight">
        <span className="font-semibold">{item.name}</span> dipilih. Ketuk
        tujuannya.
      </p>
      {onReturn && (
        <button
          type="button"
          onClick={onReturn}
          className="flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold hover:bg-white/10"
        >
          <Undo2 size={16} aria-hidden />
          Kembalikan
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Batal memilih"
        className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white/10"
      >
        <X size={18} />
      </button>
    </motion.div>
  )
}
