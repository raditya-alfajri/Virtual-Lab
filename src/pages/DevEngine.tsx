import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core'
import { ALL_EXPERIMENTS } from '../data'
import { SHELF } from '../data/instruments'
import type { Experiment, ItemState, Value, Zone } from '../data/types'
import { useExperiment } from '../hooks/useExperiment'


type LabApi = ReturnType<typeof useExperiment>
type Playground = {
  exp: Experiment
  lab: LabApi
  selected: string | null
  tap: (id: string) => void
}

const PlaygroundContext = createContext<Playground | null>(null)
const usePlayground = () => useContext(PlaygroundContext)!

const itemsAt = (items: Record<string, ItemState>, at: string) =>
  Object.keys(items).filter((id) => items[id].at === at)

const show = (v: Value) =>
  typeof v === 'number' ? String(v).replace('.', ',') : String(v)

const innermost: CollisionDetection = (args) => {
  const area = (id: string | number) => {
    const rect = args.droppableRects.get(id)
    return rect ? rect.width * rect.height : Infinity
  }
  return pointerWithin(args)
    .filter((c) => c.id !== args.active.id)
    .sort((a, b) => area(a.id) - area(b.id))
}

export default function DevEngine() {
  const [expId, setExpId] = useState(ALL_EXPERIMENTS[0].id)
  const exp = ALL_EXPERIMENTS.find((e) => e.id === expId)!

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 font-heading text-xl font-bold">
          Playground mesin
        </h1>
        {ALL_EXPERIMENTS.map((e) => (
          <button
            key={e.id}
            onClick={() => setExpId(e.id)}
            className={`rounded-full border px-3 py-1 text-sm ${e.id === expId ? 'border-primary bg-primary-tint text-primary' : 'border-line bg-white'}`}
          >
            {e.title}
          </button>
        ))}
      </div>
      <Lab key={exp.id} exp={exp} />
    </div>
  )
}

function Lab({ exp }: { exp: Experiment }) {
  const [speed, setSpeed] = useState(1)
  const lab = useExperiment(exp, speed)
  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const tap = (id: string) => {
    if (selected === null) {
      const item = exp.items.find((i) => i.id === id)
      if (item && !item.fixed) setSelected(id)
      return
    }
    if (selected !== id) lab.drop(selected, id)
    setSelected(null)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    if (over) lab.drop(String(active.id), String(over.id))
  }

  const name = (id: string) =>
    exp.items.find((i) => i.id === id)?.name ??
    exp.zones.find((z) => z.id === id)?.name ??
    'Rak alat & bahan'

  return (
    <PlaygroundContext.Provider value={{ exp, lab, selected, tap }}>
      <DndContext
        sensors={sensors}
        collisionDetection={innermost}
        onDragStart={({ active }) => setDragging(String(active.id))}
        onDragCancel={() => setDragging(null)}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Kecepatan waktu</span>
          {[1, 5].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded border px-3 py-1 ${s === speed ? 'border-primary bg-primary text-white' : 'border-line bg-white'}`}
            >
              {s}×
            </button>
          ))}
          <button
            onClick={() => {
              lab.reset()
              setSelected(null)
            }}
            className="rounded border border-line bg-white px-3 py-1"
          >
            Reset
          </button>
          <span className="text-ink-muted">
            {lab.active ? '⏵ proses berjalan' : '⏸ diam'}
            {selected && ` · dipilih: ${name(selected)} (tap tujuan)`}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-line bg-white p-4">
              <h2 className="mb-3 font-heading font-semibold">Meja kerja</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {exp.zones.map((z) => (
                  <ZoneBox key={z.id} zone={z} />
                ))}
              </div>
            </section>
            <DropArea id={SHELF} title="Rak alat & bahan">
              {itemsAt(lab.items, SHELF).map((id) => (
                <ItemBox key={id} id={id} />
              ))}
            </DropArea>
          </div>

          <div className="space-y-4">
            {lab.hint && (
              <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                {lab.hint.target && (
                  <span className="font-semibold">
                    {name(lab.hint.target)}:{' '}
                  </span>
                )}
                {lab.hint.text}
              </p>
            )}
            <ExplanationPanel />
            <ObservationTable />
          </div>
        </div>

        <DragOverlay>
          {dragging && (
            <div className="rounded-lg border border-primary bg-white px-3 py-2 text-sm shadow-lg">
              {name(dragging)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </PlaygroundContext.Provider>
  )
}

function DropArea({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  const { lab, selected, tap } = usePlayground()
  const { setNodeRef, isOver } = useDroppable({ id })
  const warned = lab.hint?.target === id

  return (
    <section
      ref={setNodeRef}
      onClick={() => selected && tap(id)}
      className={`min-h-28 rounded-2xl border-2 border-dashed p-3 ${isOver ? 'border-primary bg-primary-tint' : warned ? 'border-red-400' : 'border-line'}`}
    >
      <h3 className="mb-2 text-sm font-semibold text-ink-muted">{title}</h3>
      <div className="flex flex-wrap items-end gap-2">{children}</div>
    </section>
  )
}

function ZoneBox({ zone }: { zone: Zone }) {
  const { lab } = usePlayground()
  return (
    <DropArea id={zone.id} title={zone.name}>
      {itemsAt(lab.items, zone.id).map((id) => (
        <ItemBox key={id} id={id} />
      ))}
    </DropArea>
  )
}

function ItemBox({ id }: { id: string }) {
  const { exp, lab, selected, tap } = usePlayground()
  const def = exp.items.find((i) => i.id === id)!
  const drag = useDraggable({ id, disabled: def.fixed })
  const target = useDroppable({ id })
  const view = lab.view[id] ?? {}
  const canUse = Boolean(exp.use?.[def.kind])
  const ring =
    selected === id
      ? 'border-primary ring-2 ring-primary'
      : target.isOver
        ? 'border-primary bg-primary-tint'
        : lab.hint?.target === id
          ? 'border-red-400'
          : 'border-line'

  return (
    <div
      ref={(node) => {
        drag.setNodeRef(node)
        target.setNodeRef(node)
      }}
      {...drag.listeners}
      {...drag.attributes}
      onClick={(e) => {
        e.stopPropagation()
        tap(id)
      }}
      className={`flex min-w-24 touch-none flex-col items-center gap-1 rounded-xl border bg-white p-2 text-center text-xs select-none ${ring} ${drag.isDragging ? 'opacity-40' : ''} ${def.fixed ? '' : 'cursor-grab'}`}
    >
      <span className="font-semibold">{def.name}</span>
      {view.level !== undefined && (
        <div className="relative h-14 w-8 overflow-hidden rounded-b-full border-2 border-ink-muted bg-white">
          <div
            className="absolute inset-x-0 bottom-0 transition-[height]"
            style={{
              height: `${Number(view.level) * 100}%`,
              background: String(view.color ?? '#DCEBF5'),
            }}
          />
        </div>
      )}
      {view.level === undefined && view.color !== undefined && (
        <div
          className="h-6 w-6 rounded-full border border-line"
          style={{ background: String(view.color) }}
        />
      )}
      {view.label !== undefined && (
        <span className="text-ink-muted">{show(view.label)}</span>
      )}
      {view.reading !== undefined && (
        <span className="rounded bg-ink px-2 py-0.5 font-mono text-white">
          {show(view.reading)}
        </span>
      )}
      {canUse && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            lab.use(id)
          }}
          className="rounded bg-primary px-2 py-0.5 text-white"
        >
          {show(view.action ?? 'Pakai')}
        </button>
      )}
      {itemsAt(lab.items, id).length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 border-t border-line pt-1">
          {itemsAt(lab.items, id).map((child) => (
            <ItemBox key={child} id={child} />
          ))}
        </div>
      )}
    </div>
  )
}

function ExplanationPanel() {
  const { lab } = usePlayground()
  const e = lab.explanation
  return (
    <section className="rounded-2xl border border-line bg-white p-4 text-sm">
      <h2 className="mb-2 font-heading font-semibold">Penjelasan</h2>
      {e ? (
        <div className="space-y-2">
          <p className="font-semibold">{e.result}</p>
          <p>{e.reason}</p>
          {e.formula && (
            <p className="rounded bg-primary-tint px-2 py-1 font-mono">
              {e.formula}
            </p>
          )}
        </div>
      ) : (
        <p className="text-ink-muted">
          Penjelasan muncul setelah kamu mengukur.
        </p>
      )}
    </section>
  )
}

function ObservationTable() {
  const { lab } = usePlayground()
  return (
    <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 text-sm">
      <h2 className="mb-2 font-heading font-semibold">Tabel pengamatan</h2>
      <table className="w-full">
        <thead>
          <tr className="text-left text-ink-muted">
            {lab.columns.map((c) => (
              <th key={c.key} className="pr-3 font-medium">
                {c.label}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {lab.observationRows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {lab.columns.map((c) => (
                <td key={c.key} className="py-1 pr-3">
                  {show(row[c.key])}
                </td>
              ))}
              <td>
                <button
                  onClick={() => lab.removeRow(i)}
                  className="text-ink-muted hover:text-red-600"
                  aria-label="Hapus baris"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lab.observationRows.length === 0 && (
        <p className="mt-2 text-ink-muted">
          Belum ada data. Ukur dengan alat ukur.
        </p>
      )}
    </section>
  )
}
