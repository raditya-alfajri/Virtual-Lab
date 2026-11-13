import {
  PointerSensor,
  type Modifier,
  type PointerActivationConstraint,
  type PointerSensorProps,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { getEventCoordinates } from '@dnd-kit/utilities'

/**
 * A tool in the tray is dragged under its own id, so it does not clash with
 * the same item in the room, which is out of view but still draggable.
 */
const PREFIX = 'tray:'

export const trayDragId = (itemId: string) => `${PREFIX}${itemId}`

export const isTrayDrag = (id: UniqueIdentifier) =>
  String(id).startsWith(PREFIX)

/** The item a drag moves, whether it started in the room or in the tray. */
export const draggedItemId = (id: UniqueIdentifier) =>
  isTrayDrag(id) ? String(id).slice(PREFIX.length) : String(id)

/** A tray tool starts to move when pulled up; a sideways swipe scrolls the tray instead. */
const TRAY_START: PointerActivationConstraint = {
  distance: { y: 8 },
  tolerance: { x: 12 },
}

/** How far the pointer must move before a drag of `id` starts. */
export const startConstraint = (
  id: UniqueIdentifier,
  usual?: PointerActivationConstraint,
) => (isTrayDrag(id) ? TRAY_START : usual)

/** The pointer sensor of the lab, with the tray's own way to start a drag. */
export class LabPointerSensor extends PointerSensor {
  constructor(props: PointerSensorProps) {
    const activationConstraint = startConstraint(
      props.active,
      props.options.activationConstraint,
    )
    super({ ...props, options: { ...props.options, activationConstraint } })
  }
}

/**
 * Puts a tool dragged from the tray just above the finger, centred on it, as
 * it starts in a small tray button and not where the item stands.
 */
export const aboveFinger: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  const start = activatorEvent && getEventCoordinates(activatorEvent)
  if (!draggingNodeRect || !start) return transform
  return {
    ...transform,
    x:
      transform.x +
      start.x -
      draggingNodeRect.left -
      draggingNodeRect.width / 2,
    y: transform.y + start.y - draggingNodeRect.top - draggingNodeRect.height,
  }
}
