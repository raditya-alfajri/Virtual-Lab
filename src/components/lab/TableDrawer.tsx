import { Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Column, Row } from '../../data/types'
import { formatCell } from './format-cell'

type Props = {
  open: boolean
  columns: Column[]
  rows: Row[]
  onRemove: (index: number) => void
  onClose: () => void
}

export default function TableDrawer({
  open,
  columns,
  rows,
  onRemove,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          aria-label="Tabel data"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-[1500] flex max-h-[60%] flex-col rounded-t-2xl border-t border-line bg-bg shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-line py-2 pr-3 pl-5">
            <h2 className="font-heading font-bold">
              Tabel data{' '}
              <span className="font-sans text-sm font-normal text-ink-muted">
                ({rows.length} baris)
              </span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup tabel"
              className="rounded-md p-1.5 text-ink-muted hover:bg-primary-tint hover:text-ink"
            >
              <X size={18} />
            </button>
          </header>
          <div className="overflow-auto px-5 py-3">
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                Belum ada data. Data tercatat saat kamu memakai alat ukur.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-muted">
                    <th className="w-10 py-2 font-semibold">No.</th>
                    {columns.map((column) => (
                      <th key={column.key} className="py-2 pr-4 font-semibold">
                        {column.label}
                      </th>
                    ))}
                    <th className="w-10 py-2">
                      <span className="sr-only">Hapus</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-line last:border-0"
                    >
                      <td className="py-2 text-ink-muted">{index + 1}</td>
                      {columns.map((column) => (
                        <td key={column.key} className="py-2 pr-4">
                          {formatCell(row[column.key])}
                        </td>
                      ))}
                      <td className="py-1">
                        <button
                          type="button"
                          onClick={() => onRemove(index)}
                          aria-label={`Hapus baris ${index + 1}`}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-primary-tint hover:text-ink"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
