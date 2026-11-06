import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronUp } from 'lucide-react'
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'motion/react'

// Tinggi bagian panel yang terlihat saat tertutup. Wadah panel memberi
// ruang sebesar ini di bawah adegan (pb-14).
export const SHEET_PEEK = 56

const SNAP = { type: 'spring', bounce: 0, duration: 0.35 } as const

// Panel bawah yang bisa ditarik ke atas (mode HP potret). Saat tertutup hanya
// pegangan dan ringkasan yang terlihat.
export default function BottomSheet({
  title,
  summary,
  children,
}: {
  title: string
  summary: string
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLElement>(null)
  const dragged = useRef(false)
  const [height, setHeight] = useState(0)
  const [open, setOpen] = useState(false)
  const controls = useDragControls()
  // Mulai di luar layar, lalu meluncur ke posisi tertutup setelah diukur.
  const y = useMotionValue(10000)
  const closedY = Math.max(height - SHEET_PEEK, 0)
  const backdrop = useTransform(y, [0, closedY || 1], [0.35, 0])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.contentRect.height),
    )
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!height) return
    const run = animate(y, open ? 0 : closedY, SNAP)
    return () => run.stop()
  }, [open, closedY, height, y])

  const settle = (next: boolean) => {
    if (next === open) animate(y, next ? 0 : closedY, SNAP)
    else setOpen(next)
  }

  return (
    <>
      <motion.div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`absolute inset-0 z-20 bg-ink ${open ? '' : 'pointer-events-none'}`}
        style={{ opacity: backdrop }}
      />
      <motion.section
        ref={sheetRef}
        aria-label={title}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: closedY }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true
        }}
        onDragEnd={(_, info) => {
          const fling = info.velocity.y
          settle(
            fling < -300 ? true : fling > 300 ? false : y.get() < closedY / 2,
          )
        }}
        style={{ y }}
        className="absolute inset-x-0 bottom-0 z-30 flex h-[72%] flex-col rounded-t-2xl border-t border-line bg-white shadow-[0_-4px_16px_rgb(0_0_0/0.08)]"
      >
        <button
          type="button"
          aria-expanded={open}
          onPointerDown={(e) => {
            dragged.current = false
            controls.start(e)
          }}
          onClick={() => {
            if (dragged.current) return
            setOpen(!open)
          }}
          className="flex shrink-0 touch-none flex-col items-stretch px-4 pt-1.5 text-left"
          style={{ height: SHEET_PEEK }}
        >
          <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line" />
          <span className="flex flex-1 items-center gap-2">
            <span className="font-heading text-sm font-semibold">{title}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
              {summary}
            </span>
            <ChevronUp
              size={20}
              aria-hidden
              className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
        {children}
      </motion.section>
    </>
  )
}
