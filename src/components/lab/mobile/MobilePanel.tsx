import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  animate,
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Column, Explanation, Row } from '../../../data/types'
import { ExplanationContent, TableContent } from '../LabPanel'
import { useElementSize } from './use-element-size'

type Tab = 'explanation' | 'table' | 'assistant'

type Props = {
  /** `sheet` slides up from the bottom; `side` stays open beside the stage. */
  variant: 'sheet' | 'side'
  explanation: Explanation | null
  objectives: string[]
  tips: string[]
  columns: Column[]
  rows: Row[]
  onRemoveRow: (index: number) => void
}

/** Height of the closed sheet: the grip and the tab row. */
const PEEK_PX = 64
/** How far, in px, or how fast, in px/s, a drag must go to open or close. */
const SNAP_DISTANCE = 40
const SNAP_SPEED = 300
const SLIDE = { type: 'spring', stiffness: 420, damping: 40 } as const
const NO_SLIDE = { duration: 0 } as const

export default function MobilePanel({
  variant,
  explanation,
  objectives,
  tips,
  columns,
  rows,
  onRemoveRow,
}: Props) {
  const [tab, setTab] = useState<Tab>('explanation')
  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const [shownExplanation, setShownExplanation] = useState(explanation)
  const panelId = useId()

  const isSheet = variant === 'sheet'

  if (explanation !== shownExplanation) {
    setShownExplanation(explanation)
    if (explanation) {
      setTab('explanation')
      if (isSheet && !open) setUnseen(true)
    } else {
      setUnseen(false)
    }
  }

  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (next) setUnseen(false)
  }

  const chooseTab = (next: Tab) => {
    setTab(next)
    if (isSheet) changeOpen(true)
  }

  const tabs = (
    <div role="tablist" aria-label="Panel praktikum" className="flex gap-1">
      <TabButton
        selected={tab === 'explanation'}
        controls={panelId}
        onClick={() => chooseTab('explanation')}
      >
        {unseen ? (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            Penjelasan baru
          </span>
        ) : (
          'Penjelasan'
        )}
      </TabButton>
      <TabButton
        selected={tab === 'table'}
        controls={panelId}
        onClick={() => chooseTab('table')}
      >
        Tabel ({rows.length})
      </TabButton>
      <TabButton
        selected={tab === 'assistant'}
        controls={panelId}
        onClick={() => chooseTab('assistant')}
      >
        Labi
      </TabButton>
    </div>
  )

  const content = (
    <div
      id={panelId}
      role="tabpanel"
      className={clsx(
        'min-h-0 flex-auto overflow-y-auto overscroll-contain px-4 pt-2 pb-4 leading-relaxed',
        tab === 'explanation' ? 'text-base' : 'text-sm',
      )}
    >
      {tab === 'explanation' && (
        <ExplanationContent
          explanation={explanation}
          objectives={objectives}
          tips={tips}
          large
        />
      )}
      {tab === 'table' && (
        <TableContent columns={columns} rows={rows} onRemoveRow={onRemoveRow} />
      )}
      {tab === 'assistant' && <div className="min-h-32" />}
    </div>
  )

  if (!isSheet) {
    return (
      <aside
        aria-label="Panel praktikum"
        className="flex w-72 shrink-0 flex-col border-l border-line bg-white"
      >
        <div className="shrink-0 overflow-x-auto border-b border-line px-2 py-1">
          {tabs}
        </div>
        {content}
      </aside>
    )
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen} tabs={tabs}>
      {content}
    </Sheet>
  )
}

function TabButton({
  selected,
  controls,
  onClick,
  children,
}: {
  selected: boolean
  controls: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      onClick={onClick}
      className={clsx(
        'h-11 shrink-0 rounded-full px-3 text-sm font-semibold whitespace-nowrap',
        selected ? 'bg-primary-tint text-primary' : 'text-ink-muted',
      )}
    >
      {children}
    </button>
  )
}

function Sheet({
  open,
  onOpenChange,
  tabs,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tabs: ReactNode
  children: ReactNode
}) {
  const [frameRef, size] = useElementSize<HTMLElement>()
  const closedY = Math.max(0, size.h - PEEK_PX)
  const measured = size.h > 0
  const y = useMotionValue(0)
  const dragControls = useDragControls()
  const reduceMotion = useReducedMotion()
  const shownOpen = useRef<boolean | null>(null)
  const dragged = useRef(false)
  const slide = reduceMotion ? NO_SLIDE : SLIDE

  // The sheet is as tall as its content, so its closed offset follows the
  // content; only opening and closing slide, a new height just snaps.
  useLayoutEffect(() => {
    if (!measured) return
    const target = open ? 0 : closedY
    const toggled = shownOpen.current !== null && shownOpen.current !== open
    shownOpen.current = open
    if (!toggled) {
      y.jump(target)
      return
    }
    const animation = animate(y, target, slide)
    return () => animation.stop()
  }, [measured, open, closedY, y, slide])

  const Chevron = open ? ChevronDown : ChevronUp

  return (
    <>
      <div aria-hidden className="shrink-0" style={{ height: PEEK_PX }} />
      <AnimatePresence>
        {open && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 z-30 bg-ink/30"
          />
        )}
      </AnimatePresence>
      <motion.section
        ref={frameRef}
        aria-label="Panel praktikum"
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: closedY }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true
        }}
        onDragEnd={(_, info) => {
          const up =
            info.offset.y < -SNAP_DISTANCE || info.velocity.y < -SNAP_SPEED
          const down =
            info.offset.y > SNAP_DISTANCE || info.velocity.y > SNAP_SPEED
          const next = up ? true : down ? false : open
          onOpenChange(next)
          animate(y, next ? 0 : closedY, slide)
        }}
        style={{ y, visibility: measured ? 'visible' : 'hidden' }}
        className="absolute inset-x-0 bottom-0 z-40 flex max-h-[75%] flex-col rounded-t-2xl border-t border-line bg-white shadow-[0_-8px_24px_rgb(37_36_56/0.12)]"
      >
        <div
          onPointerDown={(event) => {
            dragged.current = false
            dragControls.start(event)
          }}
          onClickCapture={(event) => {
            if (!dragged.current) return
            dragged.current = false
            event.stopPropagation()
          }}
          className="shrink-0 touch-none select-none"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => onOpenChange(!open)}
            className="flex h-4 w-full items-end justify-center"
          >
            <span className="h-1 w-10 rounded-full bg-line" />
          </button>
          <div className="flex h-12 items-center gap-1 pr-1 pl-2">
            <div className="min-w-0 flex-1 overflow-x-auto">{tabs}</div>
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? 'Tutup panel' : 'Buka panel'}
              onClick={() => onOpenChange(!open)}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:text-ink"
            >
              <Chevron size={20} />
            </button>
          </div>
        </div>
        {children}
      </motion.section>
    </>
  )
}
