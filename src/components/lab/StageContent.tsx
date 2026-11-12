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
import {
  attachedTouchTarget,
  MIN_TOUCH_PX,
  touchTarget,
} from './mobile/touch-target'
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

  const minTouch = compact && scale > 0 ? MIN_TOUCH_PX / scale : 0

  /** The finger-sized tap box around a rect, on phones only. */
  const touchBoxOf = (rect: Rect): Rect | undefined =>
    minTouch > 0 ? touchTarget(rect, minTouch) : undefined

  const localBox = (box: Rect | undefined, rect: Rect) =>
    box && { ...box, x: box.x - rect.x, y: box.y - rect.y }

  const parentRectOf = (itemId: string): Rect | undefined =>
    attachDepth(items, itemId) > 0
      ? resolveItemRect(layout, items, items[itemId].at)
      : undefined

  /** On phones an attached item only takes the pointer where it sticks out. */
  const touchHandleOf = (itemId: string, rect: Rect): Rect | undefined => {
    const parent = parentRectOf(itemId)
    if (minTouch <= 0 || !parent) return undefined
    return localBox(attachedTouchTarget(rect, minTouch, parent), rect)
  }

  // Tap boxes of free items lie under every drawing, so a box that spills
  // over a neighbour never takes taps meant for the neighbour's own drawing.
  const itemTouchBoxes = experiment.items.flatMap((item) => {
    const rect = resolveItemRect(layout, items, item.id)
    if (!rect || parentRectOf(item.id)) return []
    const box = touchBoxOf(rect)
    return box ? [{ id: item.id, box }] : []
  })

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
              hitArea={localBox(touchBoxOf(rect), rect)}
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
      {itemTouchBoxes.map(({ id, box }) => (
        <span
          key={id}
          aria-hidden
          onClick={() => controls.handleItemClick(id)}
          className="absolute z-0"
          style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        />
      ))}
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
              touchHandle={touchHandleOf(item.id, rect)}
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
