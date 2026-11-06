import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
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
import type {
  LabelSide,
  MobileView,
  Rect,
  SceneLayout,
} from '../../simulations/types'
import Readout from './assets/Readout'
import {
  MIN_TOUCH,
  fitCamera,
  itemTouchTargets,
  labelScale,
  pickTarget,
  trayItems,
  zoneTouchTargets,
  type Camera,
  type Size,
} from './camera'
import { innermostItemFirst } from './collision'
import { dropTarget } from './dropTarget'
import { DRAWS_OWN_READING } from './kinds'
import LabAsset from './LabAsset'
import SelectionBar from './mobile/SelectionBar'
import ToolTray, { type TrayEntry } from './mobile/ToolTray'
import ViewTabs from './mobile/ViewTabs'
import { boundsOf, placeItem } from './placement'

type LabApi = ReturnType<typeof useExperiment>

type Props = {
  exp: Experiment
  lab: LabApi
  layout: SceneLayout
  selected: string | null
  onSelect: (id: string | null) => void
  // Mode HP: area kerja yang tampil satu per satu. Tanpa ini, adegan utuh
  // diskalakan (desktop).
  views?: MobileView[]
  landscape?: boolean
}

type Scene = Props & {
  dragging: string | null
  // Tujuan yang akan menerima benda yang sedang diseret (setelah diteruskan
  // dari benda yang menempel ke induknya).
  over: string | null
  hint: Hint | null
  tap: (id: string) => void
  // Mode HP saja: posisi kamera, skala label & tombol aksi, dan ketukan di
  // area kosong yang diteruskan ke benda atau zona terdekat.
  camera: Camera | null
  ui: number
  tapAt: (e: MouseEvent) => void
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
  const { exp, lab, layout, selected, onSelect, views, landscape } = props
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Hint | null>(null)
  // Mode HP: area kerja aktif, ukuran bingkai kamera, dan apakah perubahan
  // kamera berikutnya dianimasikan (pindah tab) atau langsung (ukuran layar).
  const [viewId, setViewId] = useState(views?.[0]?.id)
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 })
  const [glide, setGlide] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
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

  const view = views?.find((v) => v.id === viewId) ?? views?.[0]
  const camera = view ? fitCamera(view.region, viewport, layout.stage) : null
  const ui = camera ? labelScale(camera.scale) : 1

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

  // Mode HP: ketukan yang tidak mengenai gambar benda diteruskan ke benda
  // yang area sentuhnya memuat titik itu, lalu ke zona (kalau ada benda
  // terpilih). Selain itu, pilihan dibatalkan.
  const tapAt = (e: MouseEvent) => {
    const frame = stageRef.current
    if (!frame || !camera?.scale) return
    const box = frame.getBoundingClientRect()
    const k = box.width / layout.stage.width
    const p = { x: (e.clientX - box.left) / k, y: (e.clientY - box.top) / k }
    const id =
      pickTarget(
        p,
        itemTouchTargets(exp, layout, lab.items, camera.scale, !!selected),
      ) ??
      (selected ? pickTarget(p, zoneTouchTargets(layout, camera.scale)) : null)
    if (id) tap(id)
    else onSelect(null)
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

  const stage = (
    <>
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
    </>
  )

  const entry = (id: string): TrayEntry => {
    const def = exp.items.find((i) => i.id === id)!
    const view = lab.view[id]
    // Label yang sama dengan di adegan (mis. isi tabung), agar benda
    // bernama sama (tiga tabung reaksi K1) bisa dibedakan.
    const detail =
      view?.label ??
      (DRAWS_OWN_READING.has(def.kind) ? undefined : view?.reading)
    return {
      id,
      kind: def.kind,
      name: def.name,
      detail: detail === undefined ? undefined : String(detail),
      view,
      home: layout.home[id],
    }
  }

  const mobileBody = view && (
    <MobileBody
      landscape={landscape ?? false}
      tabs={
        <ViewTabs
          views={views!}
          active={view.id}
          panelId={panelId}
          vertical={landscape}
          onChange={(id) => {
            setGlide(true)
            setViewId(id)
          }}
        />
      }
      stage={
        <div
          id={panelId}
          role="tabpanel"
          aria-label={view.label}
          className="relative min-h-0 min-w-0 flex-1"
        >
          <CameraStage
            stageRef={stageRef}
            glide={glide}
            onResize={(size) => {
              setGlide(false)
              setViewport(size)
            }}
          >
            {stage}
          </CameraStage>
          <AnimatePresence>
            {selected && (
              <SelectionBar
                key={selected}
                item={entry(selected)}
                onReturn={
                  lab.items[selected]?.at === SHELF
                    ? undefined
                    : () => {
                        lab.drop(selected, SHELF)
                        onSelect(null)
                      }
                }
                onCancel={() => onSelect(null)}
              />
            )}
          </AnimatePresence>
        </div>
      }
      tray={
        <ToolTray
          entries={trayItems(exp, layout, lab.items, view.region).map(entry)}
          selected={selected}
          vertical={landscape}
          onTap={tap}
        />
      }
    />
  )

  return (
    <SceneContext.Provider
      value={{ ...props, dragging, over, hint, tap, camera, ui, tapAt }}
    >
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
        {mobileBody || <ScaledStage>{stage}</ScaledStage>}

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

      {mobileBody ? (
        <p className="sr-only" aria-live="polite">
          {selected
            ? `${name(selected)} dipilih. Ketuk tujuannya, atau ketuk area kosong untuk membatalkan.`
            : 'Ketuk alat lalu ketuk tujuannya, atau seret alat ke tujuannya.'}
        </p>
      ) : (
        <p className="mt-2 min-h-5 text-sm text-ink-muted" aria-live="polite">
          {selected
            ? `${name(selected)} dipilih. Ketuk tujuannya, atau ketuk area kosong untuk menaruhnya kembali.`
            : 'Seret alat ke tujuannya, atau ketuk alat lalu ketuk tujuannya.'}
        </p>
      )}
    </SceneContext.Provider>
  )
}

// Susunan mode HP. Potret: tab di atas, adegan, rak alat di bawah. Lanskap:
// tab dan rak alat di kolom kiri agar adegan mendapat tinggi penuh.
function MobileBody({
  landscape,
  tabs,
  stage,
  tray,
}: {
  landscape: boolean
  tabs: ReactNode
  stage: ReactNode
  tray: ReactNode
}) {
  if (landscape) {
    return (
      <div className="flex min-h-0 flex-1">
        <div className="flex w-28 shrink-0 flex-col border-r border-line bg-white">
          {tabs}
          {tray}
        </div>
        {stage}
      </div>
    )
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {tabs}
      {stage}
      {tray}
    </div>
  )
}

// Panggung berukuran tetap (mis. 1440 × 1024) yang diskalakan mengikuti lebar kontainer.
function ScaledStage({ children }: { children: ReactNode }) {
  const { layout } = useScene()
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

      <HintToast />
    </div>
  )
}

// Mode HP: kamera yang memperbesar satu area kerja. Panggung digeser dan
// diskalakan seragam agar region area itu muat utuh di bingkai.
function CameraStage({
  children,
  stageRef,
  glide,
  onResize,
}: {
  children: ReactNode
  stageRef: RefObject<HTMLDivElement | null>
  glide: boolean
  onResize: (size: Size) => void
}) {
  const { layout, camera } = useScene()
  const frameRef = useRef<HTMLDivElement>(null)
  const resize = useRef(onResize)
  useEffect(() => {
    resize.current = onResize
  })

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) =>
      resize.current({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const cam = camera ?? { scale: 0, x: 0, y: 0 }
  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden bg-white">
      <motion.div
        ref={stageRef}
        className="absolute top-0 left-0"
        style={{
          width: layout.stage.width,
          height: layout.stage.height,
          originX: 0,
          originY: 0,
          visibility: cam.scale ? 'visible' : 'hidden',
        }}
        initial={false}
        animate={{ x: cam.x, y: cam.y, scale: cam.scale }}
        transition={
          glide ? { duration: 0.45, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }
        }
      >
        {children}
      </motion.div>

      <HintToast />
    </div>
  )
}

// Pesan penolakan singkat di atas adegan.
function HintToast() {
  const { hint } = useScene()
  return (
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
  )
}

// Seluruh panggung adalah rak alat & bahan: melepas benda di area kosong
// mengembalikannya ke posisi awal. Di mode HP, ketukan di area kosong hanya
// membatalkan pilihan (lihat tapAt); mengembalikan benda lewat tombol
// Kembalikan.
function ShelfArea() {
  const { layout, lab, selected, onSelect, camera, tapAt } = useScene()
  const { setNodeRef } = useDroppable({ id: SHELF })
  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        if (camera) return tapAt(e)
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
  const { exp, dragging, selected, hint, tap, camera, tapAt } = useScene()
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
        // Di HP, ketukan di zona besar (mis. meja kerja) bisa ditujukan ke
        // benda kecil di dekatnya.
        if (camera) tapAt(e)
        else if (selected) tap(id)
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

// Lebar maksimum label (max-w-28) dalam px panggung.
const LABEL_MAX_WIDTH = 112

// Mode HP: label dan tombol aksi diperbesar dari sisi yang menempel ke benda.
const GROW_FROM: Record<LabelSide, string> = {
  bottom: '50% 0',
  top: '50% 100%',
  left: '100% 50%',
  right: '0 50%',
}

function SceneItem({ id }: { id: string }) {
  const {
    exp,
    lab,
    layout,
    dragging,
    over,
    selected,
    hint,
    tap,
    camera,
    ui,
    tapAt,
  } = useScene()
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
  const labelSide =
    spot.labelSide ??
    (camera && layout.mobile?.labelSide?.[id]) ??
    layout.labelSide?.[id] ??
    'bottom'
  // Mode HP: garis penanda tetap tebal walau panggung diperkecil.
  const outlineWidth = camera?.scale && look ? 3 / camera.scale : undefined

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
          // Di HP, benda tetap (mis. penangas) meneruskan ketukan agar benda
          // kecil di atasnya (mis. labu) bisa dipilih.
          if (camera && def.fixed) tapAt(e)
          else tap(id)
        }}
        onKeyDown={onEnterOrSpace(() => tap(id))}
        className={`absolute touch-none select-none ${precise ? 'pointer-events-none' : ''} ${lifted ? 'opacity-40' : ''} ${def.fixed ? '' : 'cursor-grab'}`}
        style={{ ...place(rect), zIndex }}
      >
        <div
          className={`h-full w-full rounded-xl outline-offset-4 ${precise ? 'pointer-events-none [&_svg_*]:pointer-events-auto' : 'pointer-events-auto'} ${look}`}
          style={
            rotate || outlineWidth
              ? {
                  transform: rotate ? `rotate(${rotate}deg)` : undefined,
                  outlineWidth,
                }
              : undefined
          }
        >
          <LabAsset kind={def.kind} name={def.name} view={view} />
        </div>
        {label && (
          <span
            className={`pointer-events-none absolute w-max max-w-28 rounded-lg border border-line bg-white/95 px-2 py-0.5 text-center text-[15px] leading-tight font-medium text-ink ${LABEL_SIDE[labelSide]}`}
            style={
              camera
                ? {
                    scale: ui,
                    transformOrigin: GROW_FROM[labelSide],
                    // Lebar akhir tetap max-w-28 (112 px) panggung seperti
                    // desktop: label membungkus ke bawah, bukan menutupi label
                    // benda sebelahnya (mis. tabung di rak K1).
                    maxWidth: LABEL_MAX_WIDTH / ui,
                  }
                : undefined
            }
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
  const { lab, layout, onSelect, camera, ui } = useScene()
  const b = boundsOf(spot)
  const side = spot.parents.length
    ? 'top'
    : ((camera && layout.mobile?.actionSide?.[id]) ??
      layout.actionSide?.[id] ??
      'top')
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
      className={`absolute rounded-full bg-primary px-4 py-1 text-[15px] font-semibold whitespace-nowrap text-white shadow-md hover:opacity-90${camera ? 'flex items-center justify-center' : ''}`}
      style={{
        ...at[side],
        zIndex: spot.parents.length + 1,
        // Mode HP: teks terbaca dan tinggi sentuh minimal MIN_TOUCH px layar.
        ...(camera?.scale
          ? {
              scale: ui,
              transformOrigin: GROW_FROM[side],
              minHeight: MIN_TOUCH / (camera.scale * ui),
              minWidth: MIN_TOUCH / (camera.scale * ui),
            }
          : {}),
      }}
    >
      {action}
    </button>
  )
}
