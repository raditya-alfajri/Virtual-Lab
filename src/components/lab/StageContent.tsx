import { Fragment } from 'react'
import type { Experiment } from '../../data/types'
import {
  attachDepth,
  carriedBy,
  itemSides,
  resolveItemRect,
} from '../../simulations/position'
import type { Placement, Rect, SceneLayout } from '../../simulations/types'
import DragPreview, { type PreviewPiece } from './DragPreview'
import { isInteractionTarget } from './drop-target'
import type { AssetTurn } from './LabAsset'
import { MIN_TOUCH_PX, touchTarget } from './mobile/touch-target'
import StageFront from './StageFront'
import StageItem from './StageItem'
import StageScreen from './StageScreen'
import StageZone from './StageZone'
import { useStageScale } from './stage-scale'
import type { BenchControls, Lab } from './use-bench-controls'

type Props = {
  experiment: Experiment
  layout: SceneLayout
  lab: Lab
  controls: BenchControls
  /** Phone layout: finger-sized tap areas and buttons at screen size. */
  compact?: boolean
}

/** Everything drawn on the stage: zones, screens, items, and the drag copy. */
export default function StageContent({
  experiment,
  layout,
  lab,
  controls,
  compact = false,
}: Props) {
  const scale = useStageScale()
  const { activeId, selectedId, held, carried } = controls
  const itemCount = experiment.items.length
  const items = lab.world.items
  const screens = Object.entries(layout.screens ?? {})

  const showsReading = (itemId: string) =>
    !screens.some(([zoneId]) => items[itemId]?.at === zoneId)

  const turnOf = (itemId: string, rect: Placement): AssetTurn | undefined => {
    const home = layout.home[itemId]
    return rect.rotate
      ? { w: home.w, h: home.h, rotate: rect.rotate }
      : undefined
  }

  /** The tap box relative to the rect's own top-left, on phones only. */
  const hitAreaOf = (rect: Rect, parent?: Rect): Rect | undefined => {
    if (!compact || scale <= 0) return undefined
    const box = touchTarget(rect, MIN_TOUCH_PX / scale, parent)
    return box && { ...box, x: box.x - rect.x, y: box.y - rect.y }
  }

  const previewPieces: PreviewPiece[] =
    activeId === null
      ? []
      : [activeId, ...carried].flatMap((id) => {
          const item = experiment.items.find((it) => it.id === id)
          const rect = resolveItemRect(layout, items, id)
          if (!item || !rect) return []
          return [
            {
              item,
              rect,
              turn: turnOf(id, rect),
              labelSide: itemSides(layout, items, id).labelSide,
              view: lab.view[id],
              showReading: showsReading(id),
            },
          ]
        })

  return (
    <>
      {experiment.zones.map((zone) => {
        const rect = layout.zones[zone.id]
        return (
          rect && (
            <StageZone
              key={zone.id}
              zone={zone}
              rect={rect}
              highlight={held}
              hitArea={hitAreaOf(rect)}
              onClick={controls.handlePlaceClick}
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
              label={`Layar ${controls.nameOf(zoneId).toLowerCase()}`}
            />
          )
        )
      })}
      {experiment.items.map((item, index) => {
        const rect = resolveItemRect(layout, items, item.id)
        if (!rect) return null
        const depth = attachDepth(items, item.id)
        const { labelSide, actionSide } = itemSides(layout, items, item.id)
        // A front layer covers everything resting in its item.
        const frontDepth = Math.max(
          depth,
          ...carriedBy(items, item.id).map((id) => attachDepth(items, id)),
        )
        const parent =
          depth > 0
            ? resolveItemRect(layout, items, items[item.id].at)
            : undefined
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
              droppable={isInteractionTarget(experiment.interactions, item)}
              carried={carried.has(item.id)}
              showReading={showsReading(item.id)}
              actionSide={actionSide}
              grabByDrawing={depth > 0}
              compact={compact}
              hitArea={hitAreaOf(rect, parent)}
              onClick={controls.handleItemClick}
              onAction={controls.tapItem}
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
      <DragPreview pieces={previewPieces} centred={controls.dragFromRack} />
    </>
  )
}
