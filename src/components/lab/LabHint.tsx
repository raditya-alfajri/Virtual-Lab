import clsx from 'clsx'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

type Props = {
  hint: string | null
  onClose: () => void
  /** Sit below the title and the panel tabs floating at the top of the room. */
  low?: boolean
}

export default function LabHint({ hint, onClose, low }: Props) {
  return (
    <div
      aria-live="polite"
      className={clsx(
        'pointer-events-none absolute inset-x-0 z-[2000] flex justify-center px-4',
        low ? 'top-[4.75rem]' : 'top-3',
      )}
    >
      <AnimatePresence>
        {hint && (
          <motion.div
            key={hint}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-bg shadow-lg"
          >
            <p>{hint}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pesan"
              className="-mr-1 shrink-0 rounded-md p-0.5 hover:bg-bg/15"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
