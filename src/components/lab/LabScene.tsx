import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { AnimatePresence, motion } from 'motion/react'
import { SHELF } from '../../data/instruments'
import type { Experiment } from '../../data/types'
import type { useExperiment } from '../../hooks/useExperiment'
import type { Hint } from '../../lib/engine'
import type { Rect, SceneLayout } from '../../simulations/types'
import { innermostItemFirst } from './collision'
import LabAsset from './LabAsset'

type LabApi = ReturnType<typeof useExperiment>

type Props = {
  exp: Experiment
  lab: LabApi
  layout: SceneLayout
  selected: string | null
  onSelect: (id: string | null) => void
}

type Scene = Props & {
  dragging: string | null
  hint: Hint | null
  tap: (id: string) => void
}

const SceneContext = createContext<Scene | null>(null)
const useScene = () => useContext(SceneContext)!

// Lama pesan petunjuk tampil di atas adegan.
const HINT_MS = 3500

const place = (r: Rect) => ({
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
})

const onEnterOrSpace = (run: () => void) => (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  run()
}

export default function LabScene(props: Props) {
  const { exp, lab, layout, selected, onSelect } = props
  const [dragging, setDragging] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Hint | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )
  const collision = useMemo(
    () => innermostItemFirst(Object.keys(layout.zones)),
    [layout.zones],
  )

  useEffect(() => {
    const current = lab.hint
    if (!current) return
    const timer = setTimeout(() => setDismissed(current), HINT_MS)
    return () => clearTimeout(timer)
  }, [lab.hint])
  const hint = lab.hint && lab.hint !== dismissed ? lab.hint : null

  const name = (id: string | number) =>
    exp.items.find((i) => i.id === id)?.name ??
    exp.zones.find((z) => z.id === id)?.name ??
    'Rak alat & bahan'

  const tap = (id: string) => {
    if (selected === null) {
      const item = exp.items.find((i) => i.id === id)
      if (item && !item.fixed) onSelect(id)
      return
    }
    if (selected !== id) lab.drop(selected, id)
    onSelect(null)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    if (over) lab.drop(String(active.id), String(over.id))
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${name(active.id)} diangkat.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${name(active.id)} berada di atas ${name(over.id)}.`
        : `${name(active.id)} tidak berada di atas tujuan.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${name(active.id)} dilepas di ${name(over.id)}.`
        : `${name(active.id)} dilepas.`,
    onDragCancel: ({ active }) => `Batal memindahkan ${name(active.id)}.`,
  }

  const draggingDef = exp.items.find((i) => i.id === dragging)

  return (
    <SceneContext.Provider value={{ ...props, dragging, hint, tap }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'Seret alat ke tujuannya. Bisa juga: pilih alat dengan Enter, lalu pilih tujuannya.',
          },
        }}
        onDragStart={({ active }) => {
          setDragging(String(active.id))
          onSelect(null)
        }}
        onDragCancel={() => setDragging(null)}
        onDragEnd={onDragEnd}
      >
        <ScaledStage>
          <ShelfArea />
          {Object.entries(layout.zones).map(([id, rect]) => (
            <ZoneArea key={id} id={id} rect={rect} />
          ))}
          {exp.items.map((item) => (
            <SceneItem key={item.id} id={item.id} />
          ))}
        </ScaledStage>

        <DragOverlay dropAnimation={null}>
          {draggingDef && (
            <div className="h-full w-full cursor-grabbing drop-shadow-lg">
              <LabAsset
                kind={draggingDef.kind}
                name={draggingDef.name}
                view={lab.view[draggingDef.id]}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <p className="mt-2 min-h-5 text-sm text-ink-muted" aria-live="polite">
        {selected
          ? `${name(selected)} dipilih. Ketuk tujuannya, atau ketuk area kosong untuk menaruhnya kembali.`
          : 'Seret alat ke tujuannya, atau ketuk alat lalu ketuk tujuannya.'}
      </p>
    </SceneContext.Provider>
  )
}

// Panggung berukuran tetap (mis. 1440 × 1024) yang diskalakan mengikuti lebar kontainer.
function ScaledStage({ children }: { children: ReactNode }) {
  const { layout, hint } = useScene()
  const { width, height } = layout.stage
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / width),
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [width])

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-2xl border border-line bg-white"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          visibility: scale ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>

      <AnimatePresence>
        {hint && (
          <motion.p
            key={hint.text}
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-3 top-3 mx-auto w-fit max-w-xl rounded-xl bg-ink px-4 py-2 text-center text-sm text-white shadow-lg"
          >
            {hint.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// Seluruh panggung adalah rak alat & bahan: melepas benda di area kosong
// mengembalikannya ke posisi awal.
function ShelfArea() {
  const { layout, lab, selected, onSelect } = useScene()
  const { setNodeRef } = useDroppable({ id: SHELF })
  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        if (!selected) return
        lab.drop(selected, SHELF)
        onSelect(null)
      }}
      className="absolute inset-0"
    >
      <img
        src={layout.background}
        alt=""
        draggable={false}
        className="pointer-events-none h-full w-full select-none"
      />
    </div>
  )
}

function ZoneArea({ id, rect }: { id: string; rect: Rect }) {
  const { exp, dragging, selected, hint, tap } = useScene()
  const { setNodeRef, isOver } = useDroppable({ id })
  const zone = exp.zones.find((z) => z.id === id)
  const choosing = dragging !== null || selected !== null
  const look = isOver
    ? 'border-primary bg-primary-tint/50'
    : hint?.target === id
      ? 'border-ink'
      : choosing
        ? 'border-primary/50'
        : 'border-transparent'

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={selected ? 0 : -1}
      aria-label={zone?.name ?? id}
      onClick={(e) => {
        e.stopPropagation()
        if (selected) tap(id)
      }}
      onKeyDown={onEnterOrSpace(() => selected && tap(id))}
      className={`absolute rounded-3xl border-4 border-dashed transition-colors ${look}`}
      style={place(rect)}
    />
  )
}

function SceneItem({ id }: { id: string }) {
  const { exp, lab, layout, selected, hint, tap } = useScene()
  const def = exp.items.find((i) => i.id === id)!
  const drag = useDraggable({
    id,
    disabled: def.fixed,
    attributes: { roleDescription: 'alat yang bisa diseret' },
  })
  const target = useDroppable({ id })

  const at = lab.items[id].at
  const rect = layout.zones[at] ?? layout.home[id]
  if (!rect) return null

  const view = lab.view[id]
  const label = view?.label === undefined ? undefined : String(view.label)
  const look =
    selected === id
      ? 'outline-4 outline-primary'
      : target.isOver
        ? 'bg-primary-tint/60 outline-4 outline-dashed outline-primary'
        : hint?.target === id
          ? 'outline-4 outline-dashed outline-ink'
          : ''

  return (
    <div
      ref={(node) => {
        drag.setNodeRef(node)
        target.setNodeRef(node)
      }}
      {...drag.listeners}
      {...drag.attributes}
      aria-label={label ? `${def.name}, ${label}` : def.name}
      onClick={(e) => {
        e.stopPropagation()
        tap(id)
      }}
      onKeyDown={onEnterOrSpace(() => tap(id))}
      className={`absolute touch-none rounded-xl outline-offset-4 select-none ${look} ${drag.isDragging ? 'opacity-40' : ''} ${def.fixed ? '' : 'cursor-grab'}`}
      style={place(rect)}
    >
      <LabAsset kind={def.kind} name={def.name} view={view} />
      {label && (
        <span className="pointer-events-none absolute top-full left-1/2 mt-2 w-max max-w-28 -translate-x-1/2 rounded-lg border border-line bg-white/95 px-2 py-0.5 text-center text-[15px] leading-tight font-medium text-ink">
          {label}
        </span>
      )}
    </div>
  )
}
