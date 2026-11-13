import {
  DndContext,
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
import { useLabi } from '../../hooks/useLabi'
import { SHELF } from '../../lib/engine'
import { getBackgroundUrl } from '../../simulations'
import {
  attachDepth,
  carriedBy,
  itemSides,
  resolveItemRect,
} from '../../simulations/position'
import type { Placement, Rect, SceneLayout } from '../../simulations/types'
import Labi from '../labi/Labi'
import LabiChat from '../labi/LabiChat'
import { holds } from './camera'
import DragPreview, { type PreviewPiece } from './DragPreview'
import {
  isInteractionTarget,
  pickDropTarget,
  type DropData,
} from './drop-target'
import { onActivateKey } from './keyboard'
import type { AssetTurn } from './LabAsset'
import LabHint from './LabHint'
import {
  PANEL_WIDTH,
  useLabLayout,
  usePhone,
  type LabLayout,
} from './lab-layout'
import LabPanel, { type PanelTab } from './LabPanel'
import LabStage from './LabStage'
import { useMovingItems } from './moving'
import StageFront from './StageFront'
import StageItem from './StageItem'
import StageScreen from './StageScreen'
import StageViewTabs from './StageViewTabs'
import StageZone from './StageZone'
import ToolTray from './ToolTray'
import { inTray, type TrayRule } from './tray-rule'
import {
  aboveFinger,
  draggedItemId,
  isTrayDrag,
  LabPointerSensor,
} from './tray-drag'

type Props = {
  experiment: Experiment
  layout: SceneLayout
  lab: ReturnType<typeof useExperiment>
  /** The title bar, drawn to suit the layout. */
  header?: (mode: LabLayout) => ReactNode
}

/** Height of the title and tabs floating at the top of the room. */
const TOP_BAR = { wide: 84, side: 68 }

const SHELF_NAME = 'Rak alat'
const SHELF_DROP: DropData = { layer: 'shelf' }

const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const candidates = hits.flatMap((hit) => {
    const data = args.droppableContainers.find((c) => c.id === hit.id)?.data
      .current as DropData | undefined
    return data ? [{ ...data, id: String(hit.id) }] : []
  })
  const target = pickDropTarget(candidates, draggedItemId(args.active.id))
  return hits.filter((hit) => hit.id === target)
}

export default function LabBench({ experiment, layout, lab, header }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [fromTray, setFromTray] = useState(false)
  const [hintClosed, setHintClosed] = useState(false)
  const mode = useLabLayout()
  const phone = usePhone()
  const stacked = mode === 'stack'
  const [pickedTab, setPickedTab] = useState<PanelTab | null>(null)
  const [chatFocus, setChatFocus] = useState(0)
  // The part of the stage on screen, in stage coordinates.
  const [seen, setSeen] = useState<Rect | null>(null)
  // The panel stays closed until a tab is picked, so the room has the screen.
  const panelTab = pickedTab
  const labi = useLabi(experiment, lab)
  // An upright phone shows one work area at a time, enlarged.
  const views = stacked ? (layout.views ?? []) : []
  const [viewId, setViewId] = useState<string | null>(null)
  const view = views.find((v) => v.id === viewId) ?? views.at(0)
  const suppressClick = useRef(false)
  const sensors = useSensors(
    useSensor(LabPointerSensor, { activationConstraint: { distance: 5 } }),
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

  const locate = (itemId: string) => {
    const rect = placeOf(itemId)
    return rect ? { x: rect.x + rect.w / 2, y: rect.y } : null
  }

  const moving = useMovingItems(
    Object.fromEntries(
      Object.keys(layout.motion ?? {}).map((id) => [id, placeOf(id)]),
    ),
    lab.world.time,
  )

  // The tools outside the work area on screen stay within reach in a tray.
  const guided = labi.state.guiding ? labi.state.target : null
  const trayRule: TrayRule | null = !view
    ? null
    : phone && seen
      ? { kind: 'sight', seen, moving }
      : { kind: 'region', region: view.region }
  const outside = trayRule
    ? experiment.items.flatMap((item) => {
        const rect = item.fixed ? undefined : placeOf(item.id)
        return rect && inTray(item.id, rect, trayRule)
          ? [{ item, home: layout.home[item.id], view: lab.view[item.id] }]
          : []
      })
    : []
  // What Labi keeps clear of on a phone: everything on the bench.
  const obstacles = phone
    ? [
        ...experiment.items.flatMap((item) => {
          const rect = placeOf(item.id)
          return rect ? [rect] : []
        }),
        ...experiment.zones.flatMap((zone) => {
          const rect = layout.zones[zone.id]
          return rect ? [rect] : []
        }),
      ]
    : []
  // What the guide points at comes first, so it is on screen in the tray.
  const tray = [
    ...outside.filter(({ item }) => item.id === guided),
    ...outside.filter(({ item }) => item.id !== guided),
  ]
  const guidedAt = guided ? locate(guided) : null
  // The work area to go to for the next step, when it is not the open one.
  const flagged =
    view && guidedAt && !holds(view.region, guidedAt)
      ? views.find((v) => holds(v.region, guidedAt))?.id
      : undefined
  const selectedName =
    experiment.items.find((item) => item.id === selectedId)?.name ?? null

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

  const nameOf = (dragOrDropId: UniqueIdentifier) => {
    const id = draggedItemId(dragOrDropId)
    return id === SHELF
      ? SHELF_NAME
      : (experiment.items.find((item) => item.id === id)?.name ??
          experiment.zones.find((zone) => zone.id === id)?.name ??
          id)
  }

  const pickTab = (tab: PanelTab | null) => {
    setPickedTab(tab)
    setChatFocus(0)
  }

  const answerYourself = () => {
    setPickedTab('labi')
    setChatFocus((count) => count + 1)
  }

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
    setActiveId(draggedItemId(active.id))
    setFromTray(isTrayDrag(active.id))
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
    setFromTray(false)
    ignoreNextClick()
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    endDrag()
    if (over) dropOn(draggedItemId(active.id), String(over.id))
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
      {/*
        The room fills the screen and the panels float on its right; on an
        upright phone the title sits above the room, the tabs below it, and a
        picked tab slides up over the room as a sheet.
      */}
      <div
        className={clsx(
          'h-dvh overflow-hidden',
          stacked ? 'relative flex flex-col' : 'relative',
        )}
      >
        <div
          className={
            stacked
              ? 'relative order-2 min-h-0 w-full flex-1'
              : 'absolute inset-0'
          }
        >
          <LabStage
            background={getBackgroundUrl(experiment.id)}
            floorY={layout.floorY}
            reserve={panelTab ? PANEL_WIDTH[mode] : 0}
            // Under an open sheet the room moves up to stay in view.
            rest={stacked ? (panelTab ? 0 : 0.62) : 1}
            region={view?.region}
            onVisibleChange={setSeen}
            topGap={stacked ? undefined : TOP_BAR[mode]}
            onBackgroundClick={() => setSelectedId(null)}
            overlay={
              <>
                <LabHint
                  hint={hintClosed ? null : lab.hint}
                  onClose={() => setHintClosed(true)}
                  low={!stacked}
                />
                <Labi
                  state={labi.state}
                  session={labi.session}
                  locate={locate}
                  passive={activeId !== null}
                  phone={phone}
                  topClear={stacked ? undefined : TOP_BAR.side + 4}
                  obstacles={obstacles}
                  onAnswerYourself={answerYourself}
                />
              </>
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
            <DragPreview
              pieces={previewPieces}
              modifiers={fromTray ? [aboveFinger] : undefined}
            />
          </LabStage>
        </div>
        <div
          className={
            stacked
              ? 'order-1 shrink-0'
              : clsx(
                  'pointer-events-none absolute top-0 left-0 z-20 w-88 max-w-[calc(100%-18rem)]',
                  mode === 'wide' ? 'p-4' : 'p-2',
                )
          }
        >
          {header?.(mode)}
          {view && (
            <StageViewTabs
              views={views}
              active={view.id}
              flagged={flagged}
              onChange={setViewId}
            />
          )}
        </div>
        {stacked && (
          <div className="order-3 shrink-0">
            {/* On a phone the tray always keeps its place, so the room does not resize as tools come and go. */}
            {(tray.length > 0 || phone) && (
              <ToolTray
                entries={tray}
                selected={selectedId}
                selectedName={selectedName}
                pointed={guided}
                onTap={handleItemClick}
              />
            )}
            {/* Keeps the room clear of the tabs lying over its bottom edge. */}
            <div className="h-[53px]" />
          </div>
        )}
        <div
          className={
            stacked
              ? 'absolute inset-x-0 bottom-0 z-20'
              : clsx(
                  'pointer-events-none absolute inset-y-0 right-0 z-20 flex flex-col items-end',
                  mode === 'wide' ? 'p-4' : 'p-2',
                )
          }
          style={stacked ? undefined : { width: PANEL_WIDTH[mode] }}
        >
          <LabPanel
            layout={mode}
            tab={panelTab}
            onTabChange={pickTab}
            explanation={lab.explanation}
            objectives={experiment.objectives}
            tips={experiment.tips}
            columns={lab.columns}
            rows={lab.rows}
            onRemoveRow={lab.removeRow}
            assistantActivity={labi.state.messages.length}
            assistant={
              <LabiChat
                state={labi.state}
                session={labi.session}
                fill={mode !== 'wide'}
                focusRequest={chatFocus}
              />
            }
          />
        </div>
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
        'flex h-11 items-center justify-center gap-2 rounded-full border border-dashed px-5 text-sm shadow-sm backdrop-blur transition-[opacity,colors]',
        // Only there while something is held: the one moment it is of use.
        !highlight && 'pointer-events-none opacity-0',
        isOver
          ? 'border-primary bg-primary-tint'
          : 'border-primary/60 bg-primary-tint/90',
      )}
    >
      <p className="shrink-0 font-semibold whitespace-nowrap text-ink">
        {SHELF_NAME}
      </p>
      <p className="truncate text-ink-muted">
        Taruh di sini untuk mengembalikan.
      </p>
    </div>
  )
}
