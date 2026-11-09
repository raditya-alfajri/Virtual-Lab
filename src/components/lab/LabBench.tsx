import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import clsx from 'clsx'
import { useRef, useState } from 'react'
import type { Experiment } from '../../data/types'
import type { useExperiment } from '../../hooks/useExperiment'
import { SHELF } from '../../lib/engine'
import { getBackgroundUrl } from '../../simulations'
import { attachDepth, resolveItemRect } from '../../simulations/position'
import type { SceneLayout } from '../../simulations/types'
import DragPreview from './DragPreview'
import { pickDropTarget, type DropData } from './drop-target'
import { onActivateKey } from './keyboard'
import LabHint from './LabHint'
import LabPanel from './LabPanel'
import LabStage from './LabStage'
import StageItem from './StageItem'
import StageZone from './StageZone'

type Props = {
  experiment: Experiment
  layout: SceneLayout
  lab: ReturnType<typeof useExperiment>
}

const SHELF_NAME = 'Rak alat'
const SHELF_DROP: DropData = { layer: 'shelf' }

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const candidates = hits.flatMap((hit) => {
    const data = args.droppableContainers.find((c) => c.id === hit.id)?.data
      .current as DropData | undefined
    return data ? [{ ...data, id: String(hit.id) }] : []
  })
  const target = pickDropTarget(candidates, String(args.active.id))
  return hits.filter((hit) => hit.id === target)
}

export default function LabBench({ experiment, layout, lab }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hintClosed, setHintClosed] = useState(false)
  const suppressClick = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const itemCount = experiment.items.length
  const held = activeId !== null || selectedId !== null
  const activeItem = experiment.items.find((item) => item.id === activeId)

  const nameOf = (id: UniqueIdentifier) =>
    id === SHELF
      ? SHELF_NAME
      : (experiment.items.find((item) => item.id === id)?.name ??
        experiment.zones.find((zone) => zone.id === id)?.name ??
        String(id))

  const dropOn = (sourceId: string, targetId: string) => {
    setHintClosed(false)
    setSelectedId(null)
    lab.drop(sourceId, targetId)
  }

  const tapItem = (itemId: string) => {
    setHintClosed(false)
    setSelectedId(null)
    lab.tap(itemId)
  }

  const handleItemClick = (itemId: string) => {
    if (suppressClick.current) return
    if (selectedId === itemId) setSelectedId(null)
    else if (selectedId !== null) dropOn(selectedId, itemId)
    else if (!experiment.items.find((item) => item.id === itemId)?.fixed) {
      setSelectedId(itemId)
    }
  }

  const handlePlaceClick = (targetId: string) => {
    if (!suppressClick.current && selectedId !== null) {
      dropOn(selectedId, targetId)
    }
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setSelectedId(null)
    setActiveId(String(active.id))
  }

  // The browser still fires a click right after a drag ends; ignore that one.
  const endDrag = () => {
    setActiveId(null)
    suppressClick.current = true
    setTimeout(() => {
      suppressClick.current = false
    }, 0)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    endDrag()
    if (over) dropOn(String(active.id), String(over.id))
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Mengambil ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} berada di atas ${nameOf(over.id)}.`
        : `${nameOf(active.id)} tidak berada di atas tujuan.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} dilepas di ${nameOf(over.id)}.`
        : `${nameOf(active.id)} dilepas.`,
    onDragCancel: ({ active }) => `Batal memindahkan ${nameOf(active.id)}.`,
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={endDrag}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Seret benda ke tujuannya, atau tekan Enter untuk memilih benda lalu pilih tujuannya.',
        },
      }}
    >
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <LabStage
            background={getBackgroundUrl(experiment.id)}
            onBackgroundClick={() => setSelectedId(null)}
            overlay={
              <LabHint
                hint={hintClosed ? null : lab.hint}
                onClose={() => setHintClosed(true)}
              />
            }
            footer={
              <Shelf highlight={held} onClick={() => handlePlaceClick(SHELF)} />
            }
          >
            {experiment.zones.map((zone) => {
              const rect = layout.zones[zone.id]
              return (
                rect && (
                  <StageZone
                    key={zone.id}
                    zone={zone}
                    rect={rect}
                    highlight={held}
                    onClick={handlePlaceClick}
                  />
                )
              )
            })}
            {experiment.items.map((item, index) => {
              const rect = resolveItemRect(layout, lab.world.items, item.id)
              if (!rect) return null
              return (
                <StageItem
                  key={item.id}
                  item={item}
                  rect={rect}
                  // Attached items must sit above every item they could rest on.
                  zIndex={
                    1 +
                    attachDepth(lab.world.items, item.id) * itemCount +
                    index
                  }
                  view={lab.view[item.id]}
                  selected={selectedId === item.id}
                  onClick={handleItemClick}
                  onAction={tapItem}
                />
              )
            })}
            <DragPreview
              item={activeItem}
              rect={
                activeItem &&
                resolveItemRect(layout, lab.world.items, activeItem.id)
              }
              view={activeItem && lab.view[activeItem.id]}
            />
          </LabStage>
        </div>
        <LabPanel
          explanation={lab.explanation}
          objectives={experiment.objectives}
          tips={experiment.tips}
          columns={lab.columns}
          rows={lab.rows}
          onRemoveRow={lab.removeRow}
        />
      </div>
    </DndContext>
  )
}

function Shelf({
  highlight,
  onClick,
}: {
  highlight: boolean
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: SHELF, data: SHELF_DROP })
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={highlight ? 0 : -1}
      aria-label={SHELF_NAME}
      onClick={onClick}
      onKeyDown={onActivateKey(onClick)}
      className={clsx(
        'flex size-full items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors',
        isOver
          ? 'border-primary bg-primary-tint'
          : highlight
            ? 'border-primary/60 bg-primary-tint/60'
            : 'border-line',
      )}
    >
      <p className="font-heading text-sm font-bold">{SHELF_NAME}</p>
      <p className="text-sm text-ink-muted">
        Taruh benda di sini untuk mengembalikannya ke tempat awal.
      </p>
    </div>
  )
}
