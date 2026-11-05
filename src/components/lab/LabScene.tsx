import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import type { LabelSide, Rect, SceneLayout } from '../../simulations/types'
import Readout from './assets/Readout'
import { innermostItemFirst } from './collision'
import { dropTarget } from './dropTarget'
import { DRAWS_OWN_READING } from './kinds'
import LabAsset from './LabAsset'
import { boundsOf, placeItem } from './placement'

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
  // Tujuan yang akan menerima benda yang sedang diseret (setelah diteruskan
  // dari benda yang menempel ke induknya).
  over: string | null
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
  const [over, setOver] = useState<string | null>(null)
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
    if (selected !== id) lab.drop(selected, target(selected, id))
    onSelect(null)
  }

  const target = (source: string, id: string) =>
    dropTarget(exp, lab.items, source, id)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    setOver(null)
    if (over)
      lab.drop(String(active.id), target(String(active.id), String(over.id)))
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
    <SceneContext.Provider value={{ ...props, dragging, over, hint, tap }}>
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
        onDragOver={({ active, over }) =>
          setOver(over ? target(String(active.id), String(over.id)) : null)
        }
        onDragCancel={() => {
          setDragging(null)
          setOver(null)
        }}
        onDragEnd={onDragEnd}
      >
        <ScaledStage>
          <ShelfArea />
          {Object.entries(layout.zones).map(([id, rect]) => (
            <ZoneArea key={id} id={id} rect={rect} />
          ))}
          {Object.entries(layout.displays ?? {}).map(([zone, rect]) => (
            <ZoneDisplay key={zone} zone={zone} rect={rect} />
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

// Layar yang sudah tergambar di background (mis. layar neraca) menampilkan
// bacaan benda yang sedang berada di zona itu.
function ZoneDisplay({ zone, rect }: { zone: string; rect: Rect }) {
  const { lab } = useScene()
  const id = Object.keys(lab.items).find((i) => lab.items[i].at === zone)
  const reading = id ? lab.view[id]?.reading : undefined
  if (reading === undefined) return null
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute"
      style={place(rect)}
    >
      <Readout text={String(reading)} width={rect.w} height={rect.h} />
    </div>
  )
}

const LABEL_SIDE: Record<LabelSide, string> = {
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

function SceneItem({ id }: { id: string }) {
  const { exp, lab, layout, dragging, over, selected, hint, tap } = useScene()
  const def = exp.items.find((i) => i.id === id)!
  const spot = placeItem(layout, lab.items, id)
  // Benda yang diputar (mis. batang pengaduk di gelas) hanya diputar
  // gambarnya; kotak luarnya tetap tegak agar ukuran DragOverlay benar.
  // Kotak itu tidak sama dengan gambarnya, jadi tidak menerima klik dan tidak
  // dipakai sebagai tujuan.
  const rotate = spot?.rotate ?? 0
  const drag = useDraggable({
    id,
    disabled: def.fixed,
    attributes: { roleDescription: 'alat yang bisa diseret' },
  })
  const target = useDroppable({ id, disabled: rotate !== 0 })

  if (!spot) return null
  const { rect, parents } = spot
  // Benda yang menempel atau diputar hanya bisa diklik dan diseret pada
  // bagian yang tergambar, agar kotaknya yang kosong tidak menutupi induknya
  // (mis. kotak termometer menutupi tengah labu).
  const precise = rotate !== 0 || parents.length > 0

  const view = lab.view[id]
  const reading = DRAWS_OWN_READING.has(def.kind) ? undefined : view?.reading
  const tag = view?.label ?? reading
  const label = tag === undefined ? undefined : String(tag)
  const action = view?.action === undefined ? undefined : String(view.action)
  // Benda yang menempel ikut redup saat induknya diseret.
  const lifted =
    drag.isDragging || (dragging !== null && parents.includes(dragging))
  const look =
    selected === id
      ? 'outline-4 outline-primary'
      : over === id
        ? 'bg-primary-tint/60 outline-4 outline-dashed outline-primary'
        : hint?.target === id
          ? 'outline-4 outline-dashed outline-ink'
          : ''

  // Benda yang menempel digambar di atas induknya.
  const zIndex = parents.length || undefined

  return (
    <>
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
        className={`absolute touch-none select-none ${precise ? 'pointer-events-none' : ''} ${lifted ? 'opacity-40' : ''} ${def.fixed ? '' : 'cursor-grab'}`}
        style={{ ...place(rect), zIndex }}
      >
        <div
          className={`h-full w-full rounded-xl outline-offset-4 ${precise ? 'pointer-events-none [&_svg_*]:pointer-events-auto' : 'pointer-events-auto'} ${look}`}
          style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        >
          <LabAsset kind={def.kind} name={def.name} view={view} />
        </div>
        {label && (
          <span
            className={`pointer-events-none absolute w-max max-w-28 rounded-lg border border-line bg-white/95 px-2 py-0.5 text-center text-[15px] leading-tight font-medium text-ink ${LABEL_SIDE[spot.labelSide ?? layout.labelSide?.[id] ?? 'bottom']}`}
          >
            {label}
          </span>
        )}
      </div>
      {action && (
        <ActionButton id={id} name={def.name} action={action} spot={spot} />
      )}
    </>
  )
}

// Tombol untuk aksi benda (mis. Aduk, Nyalakan, Mulai), di atas benda.
// Dibuat terpisah dari benda agar tidak ikut memicu seret.
function ActionButton({
  id,
  name,
  action,
  spot,
}: {
  id: string
  name: string
  action: string
  spot: NonNullable<ReturnType<typeof placeItem>>
}) {
  const { lab, layout, onSelect } = useScene()
  const b = boundsOf(spot)
  const side = spot.parents.length ? 'top' : (layout.actionSide?.[id] ?? 'top')
  const gap = 8
  const at: Record<LabelSide, CSSProperties> = {
    top: { left: b.x + b.w / 2, top: b.y - gap, translate: '-50% -100%' },
    bottom: { left: b.x + b.w / 2, top: b.y + b.h + gap, translate: '-50% 0' },
    left: { left: b.x - gap, top: b.y + b.h / 2, translate: '-100% -50%' },
    right: { left: b.x + b.w + gap, top: b.y + b.h / 2, translate: '0 -50%' },
  }
  return (
    <button
      type="button"
      aria-label={`${action} ${name}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(null)
        lab.use(id)
      }}
      className="absolute rounded-full bg-primary px-4 py-1 text-[15px] font-semibold whitespace-nowrap text-white shadow-md hover:opacity-90"
      style={{ ...at[side], zIndex: spot.parents.length + 1 }}
    >
      {action}
    </button>
  )
}
