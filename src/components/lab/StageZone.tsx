import { useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { Zone } from '../../data/types'
import type { Rect } from '../../simulations/types'
import type { DropData } from './drop-target'
import { onActivateKey } from './keyboard'

type Props = {
  zone: Zone
  rect: Rect
  highlight: boolean
  onClick: (zoneId: string) => void
}

const dropData: DropData = { layer: 'zone' }

export default function StageZone({ zone, rect, highlight, onClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: zone.id, data: dropData })

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={highlight ? 0 : -1}
      aria-label={zone.name}
      onClick={() => onClick(zone.id)}
      onKeyDown={onActivateKey(() => onClick(zone.id))}
      className={clsx(
        'absolute rounded-xl',
        isOver
          ? 'bg-primary/15 ring-4 ring-primary'
          : highlight
            ? 'outline-2 outline-primary/60 outline-dashed'
            : 'outline-none',
      )}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  )
}
