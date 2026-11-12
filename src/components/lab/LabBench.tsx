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
import { Fragment, useRef, useState, type ReactNode } from 'react'
import type { Experiment } from '../../data/types'
import type { useExperiment } from '../../hooks/useExperiment'
import { SHELF } from '../../lib/engine'
import { getBackgroundUrl } from '../../simulations'
import {
  attachDepth,
  carriedBy,
  itemSides,
  resolveItemRect,
} from '../../simulations/position'
import type { Placement, SceneLayout } from '../../simulations/types'
import DragPreview, { type PreviewPiece } from './DragPreview'
import {
  isInteractionTarget,
  pickDropTarget,
  type DropData,
} from './drop-target'
import { onActivateKey } from './keyboard'
import type { AssetTurn } from './LabAsset'
import LabHint from './LabHint'
import LabPanel from './LabPanel'
import LabStage from './LabStage'
import StageFront from './StageFront'
import StageItem from './StageItem'
import StageScreen from './StageScreen'
import StageZone from './StageZone'

type Props = {
  experiment: Experiment
  layout: SceneLayout
  lab: ReturnType<typeof useExperiment>
  /** Sits above the stage, in the stage's column. */
  header?: ReactNode
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

export default function LabBench({ experiment, layout, lab, header }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hintClosed, setHintClosed] = useState(false)
  const suppressClick = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const itemCount = experiment.items.length
  const held = activeId !== null || selectedId !== null
  const items = lab.world.items
  const carried = new Set(activeId === null ? [] : carriedBy(items, activeId))
  const screens = Object.entries(layout.screens ?? {})

  const showsReading = (itemId: string) =>
    !screens.some(([zoneId]) => items[itemId]?.at === zoneId)

  const placeOf = (itemId: string) =>
    resolveItemRect(layout, items, itemId, lab.view)

  const turnOf = (itemId: string, rect: Placement): AssetTurn | undefined => {
    const { w, h } = rect.size ?? layout.home[itemId]
    return rect.rotate ? { w, h, rotate: rect.rotate } : undefined
  }

  const previewPieces: PreviewPiece[] =
    activeId === null
      ? []
      : [activeId, ...carried].flatMap((id) => {
          const item = experiment.items.find((it) => it.id === id)
          const rect = placeOf(id)
          if (!item || !rect) return []
          return [
            {
              item,
              rect,
              turn: turnOf(id, rect),
              labelSide: itemSides(layout, items, id, rect).labelSide,
              view: lab.view[id],
              showReading: showsReading(id),
            },
          ]
        })

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

  const pullItem = (itemId: string, value: number) => {
    setHintClosed(false)
    setSelectedId(null)
    lab.pull(itemId, value)
  }

  // The browser still fires a click right after a pull ends; ignore that one.
  const releaseItem = (itemId: string) => {
    ignoreNextClick()
    lab.release(itemId)
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

  const ignoreNextClick = () => {
    suppressClick.current = true
    setTimeout(() => {
      suppressClick.current = false
    }, 0)
  }

  // The browser still fires a click right after a drag ends; ignore that one.
  const endDrag = () => {
    setActiveId(null)
    ignoreNextClick()
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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {header}
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
            {screens.map(([zoneId, rect]) => {
              const shown = experiment.items.find(
                (item) =>
                  items[item.id]?.at === zoneId &&
                  lab.view[item.id]?.reading !== undefined,
              )
              const reading = shown && lab.view[shown.id]?.reading
              return (
                reading !== undefined && (
                  <StageScreen
                    key={zoneId}
                    rect={rect}
                    text={reading}
                    label={`Layar ${nameOf(zoneId).toLowerCase()}`}
                  />
                )
              )
            })}
            {experiment.items.map((item, index) => {
              const rect = placeOf(item.id)
              if (!rect) return null
              const depth = attachDepth(items, item.id)
              const { labelSide, actionSide } = itemSides(
                layout,
                items,
                item.id,
                rect,
              )
              const pull = layout.pull?.[item.id]
              // A front layer covers everything resting in its item.
              const frontDepth = Math.max(
                depth,
                ...carriedBy(items, item.id).map((id) =>
                  attachDepth(items, id),
                ),
              )
              return (
                <Fragment key={item.id}>
                  <StageItem
                    item={item}
                    rect={rect}
                    turn={turnOf(item.id, rect)}
                    labelSide={labelSide}
                    // Attached items must sit above every item they could rest on.
                    zIndex={1 + depth * itemCount + index}
                    view={lab.view[item.id]}
                    selected={selectedId === item.id}
                    droppable={isInteractionTarget(
                      experiment.interactions,
                      item,
                    )}
                    carried={carried.has(item.id)}
                    showReading={showsReading(item.id)}
                    actionSide={actionSide}
                    grabByDrawing={depth > 0 || rect.rotate !== undefined}
                    pull={
                      pull?.active(items)
                        ? (point) => pullItem(item.id, pull.value(point, items))
                        : undefined
                    }
                    onRelease={releaseItem}
                    onClick={handleItemClick}
                    onAction={tapItem}
                  />
                  <StageFront
                    item={item}
                    rect={rect}
                    zIndex={1 + (frontDepth + 1) * itemCount + index}
                    view={lab.view[item.id]}
                  />
                </Fragment>
              )
            })}
            <DragPreview pieces={previewPieces} />
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
        'flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm transition-colors',
        isOver
          ? 'border-primary bg-primary-tint'
          : highlight
            ? 'border-primary/60 bg-primary-tint/60'
            : 'border-line',
      )}
    >
      <p className="font-semibold text-ink">{SHELF_NAME}</p>
      <p className="truncate text-ink-muted">
        Taruh benda di sini untuk mengembalikannya ke tempat awal.
      </p>
    </div>
  )
}
