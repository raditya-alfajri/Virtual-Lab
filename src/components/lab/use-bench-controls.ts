import {
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type PointerActivationConstraint,
  type PointerSensorProps,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { useRef, useState } from 'react'
import type { Experiment } from '../../data/types'
import type { useExperiment } from '../../hooks/useExperiment'
import { SHELF } from '../../lib/engine'
import { carriedBy } from '../../simulations/position'
import { pickDropTarget, type DropData } from './drop-target'

export type Lab = ReturnType<typeof useExperiment>
export type BenchControls = ReturnType<typeof useBenchControls>

export const SHELF_NAME = 'Rak alat'
export const SHELF_DROP: DropData = { layer: 'shelf' }

/** Marks a tool-rack button, whose drags carry the item id in their data. */
export const RACK_ITEM_ATTRIBUTE = 'data-rack-item'
export const rackDragId = (itemId: string) => `rack:${itemId}`
export type RackDragData = { itemId: string }

const STAGE_CONSTRAINT: PointerActivationConstraint = { distance: 5 }
// The rack scrolls sideways (its buttons allow only horizontal panning), so a
// tool lifts off it once the finger has moved far enough up or down.
const RACK_CONSTRAINT: PointerActivationConstraint = { distance: { y: 8 } }

class BenchPointerSensor extends PointerSensor {
  constructor(props: PointerSensorProps) {
    const { target } = props.event
    const fromRack =
      target instanceof Element &&
      target.closest(`[${RACK_ITEM_ATTRIBUTE}]`) !== null
    super({
      ...props,
      options: {
        ...props.options,
        activationConstraint: fromRack ? RACK_CONSTRAINT : STAGE_CONSTRAINT,
      },
    })
  }
}

/** The item being dragged, whether it was picked up on the stage or the rack. */
function itemIdOf(active: Pick<Active, 'id' | 'data'>): string {
  const data = active.data.current as Partial<RackDragData> | undefined
  return data?.itemId ?? String(active.id)
}

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const candidates = hits.flatMap((hit) => {
    const data = args.droppableContainers.find((c) => c.id === hit.id)?.data
      .current as DropData | undefined
    return data ? [{ ...data, id: String(hit.id) }] : []
  })
  const target = pickDropTarget(candidates, itemIdOf(args.active))
  return hits.filter((hit) => hit.id === target)
}

/** Picking, tapping, and dragging items on the bench, shared by every layout. */
export function useBenchControls(experiment: Experiment, lab: Lab) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragFromRack, setDragFromRack] = useState(false)
  const [hintClosed, setHintClosed] = useState(false)
  const suppressClick = useRef(false)
  const sensors = useSensors(useSensor(BenchPointerSensor))

  const items = lab.world.items
  const carried = new Set(activeId === null ? [] : carriedBy(items, activeId))

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
    setActiveId(itemIdOf(active))
    setDragFromRack(itemIdOf(active) !== String(active.id))
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
    if (over) dropOn(itemIdOf(active), String(over.id))
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Mengambil ${nameOf(itemIdOf(active))}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(itemIdOf(active))} berada di atas ${nameOf(over.id)}.`
        : `${nameOf(itemIdOf(active))} tidak berada di atas tujuan.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(itemIdOf(active))} dilepas di ${nameOf(over.id)}.`
        : `${nameOf(itemIdOf(active))} dilepas.`,
    onDragCancel: ({ active }) =>
      `Batal memindahkan ${nameOf(itemIdOf(active))}.`,
  }

  return {
    selectedId,
    activeId,
    dragFromRack,
    held: activeId !== null || selectedId !== null,
    carried,
    hint: hintClosed ? null : lab.hint,
    closeHint: () => setHintClosed(true),
    clearSelection: () => setSelectedId(null),
    returnSelected: () => {
      if (selectedId !== null) dropOn(selectedId, SHELF)
    },
    nameOf,
    tapItem,
    handleItemClick,
    handlePlaceClick,
    dndProps: {
      sensors,
      collisionDetection,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragCancel: endDrag,
      accessibility: {
        announcements,
        screenReaderInstructions: {
          draggable:
            'Seret benda ke tujuannya, atau tekan Enter untuk memilih benda lalu pilih tujuannya.',
        },
      },
    },
  }
}
