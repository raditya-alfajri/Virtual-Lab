import { DndContext } from '@dnd-kit/core'
import { useState } from 'react'
import type { Experiment } from '../../../data/types'
import { getBackgroundUrl } from '../../../simulations'
import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  type MobileView,
  type SceneLayout,
} from '../../../simulations/types'
import LabHint from '../LabHint'
import StageContent from '../StageContent'
import { useBenchControls, type Lab } from '../use-bench-controls'
import { fitCamera, visibleArea } from './camera'
import MobilePanel from './MobilePanel'
import MobileStage from './MobileStage'
import MobileTopBar from './MobileTopBar'
import RotateTip from './RotateTip'
import SelectionBar from './SelectionBar'
import { toolRackItems } from './tool-rack'
import ToolRack from './ToolRack'
import { useElementSize } from './use-element-size'
import { useMediaQuery } from './use-media-query'
import ViewTabs from './ViewTabs'

type Props = {
  experiment: Experiment
  layout: SceneLayout
  lab: Lab
  onReset: () => void
}

const WHOLE_STAGE: MobileView[] = [
  {
    id: 'semua',
    name: 'Semua',
    region: { x: 0, y: 0, w: STAGE_WIDTH, h: STAGE_HEIGHT },
  },
]

/** The lab on a phone: one work area at a time, with the rest on the tool rack. */
export default function MobileLabBench({
  experiment,
  layout,
  lab,
  onReset,
}: Props) {
  const controls = useBenchControls(experiment, lab)
  const landscape = useMediaQuery('(orientation: landscape)')
  const views = layout.mobile?.views ?? WHOLE_STAGE
  const [viewId, setViewId] = useState(views[0].id)
  const view = views.find((it) => it.id === viewId) ?? views[0]
  const [viewportRef, viewport] = useElementSize<HTMLDivElement>()

  const camera = fitCamera(view.region, viewport)
  const area = camera.scale > 0 ? visibleArea(camera, viewport) : view.region
  const rackItems = toolRackItems(
    experiment.items,
    layout,
    lab.world.items,
    area,
  )
  const selected = experiment.items.find(
    (item) => item.id === controls.selectedId,
  )

  const tabs = views.length > 1 && (
    <ViewTabs
      views={views}
      activeId={view.id}
      onChange={setViewId}
      className={
        landscape
          ? 'min-w-0 shrink'
          : 'shrink-0 border-b border-line px-2 py-0.5'
      }
    />
  )

  const stage = (
    <div className="relative min-h-0 flex-1">
      <MobileStage
        background={getBackgroundUrl(experiment.id)}
        camera={camera}
        viewportRef={viewportRef}
        onBackgroundClick={controls.clearSelection}
        overlay={
          <>
            <LabHint
              hint={controls.hint}
              onClose={controls.closeHint}
              compact
            />
            {selected && (
              <SelectionBar
                name={selected.name}
                onCancel={controls.clearSelection}
                onReturn={controls.returnSelected}
              />
            )}
          </>
        }
      >
        <StageContent
          experiment={experiment}
          layout={layout}
          lab={lab}
          controls={controls}
          compact
        />
      </MobileStage>
    </div>
  )

  const rack = (
    <ToolRack
      items={rackItems}
      homes={layout.home}
      views={lab.view}
      selectedId={controls.selectedId}
      highlight={controls.held}
      onItemClick={controls.handleItemClick}
      onReturn={controls.returnSelected}
    />
  )

  const panel = {
    explanation: lab.explanation,
    objectives: experiment.objectives,
    tips: experiment.tips,
    columns: lab.columns,
    rows: lab.rows,
    onRemoveRow: lab.removeRow,
  }

  return (
    <DndContext {...controls.dndProps}>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-bg">
        <MobileTopBar
          experiment={experiment}
          speed={lab.speed}
          onSpeedChange={lab.setSpeed}
          onReset={onReset}
        >
          {landscape && tabs}
        </MobileTopBar>
        {landscape ? (
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              {stage}
              {rack}
            </div>
            <MobilePanel variant="side" {...panel} />
          </div>
        ) : (
          <>
            {tabs}
            <RotateTip />
            {stage}
            {rack}
            <MobilePanel variant="sheet" {...panel} />
          </>
        )}
      </div>
    </DndContext>
  )
}
