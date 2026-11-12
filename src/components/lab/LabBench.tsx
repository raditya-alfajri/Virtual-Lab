import { DndContext, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { Experiment } from '../../data/types'
import { SHELF } from '../../lib/engine'
import { getBackgroundUrl } from '../../simulations'
import type { SceneLayout } from '../../simulations/types'
import { onActivateKey } from './keyboard'
import LabHint from './LabHint'
import LabPanel from './LabPanel'
import LabStage from './LabStage'
import StageContent from './StageContent'
import {
  SHELF_DROP,
  SHELF_NAME,
  useBenchControls,
  type Lab,
} from './use-bench-controls'

type Props = {
  experiment: Experiment
  layout: SceneLayout
  lab: Lab
  /** Sits above the stage, in the stage's column. */
  header?: ReactNode
}

export default function LabBench({ experiment, layout, lab, header }: Props) {
  const controls = useBenchControls(experiment, lab)

  return (
    <DndContext {...controls.dndProps}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {header}
          <LabStage
            background={getBackgroundUrl(experiment.id)}
            onBackgroundClick={controls.clearSelection}
            overlay={
              <LabHint hint={controls.hint} onClose={controls.closeHint} />
            }
            footer={
              <Shelf
                highlight={controls.held}
                onClick={() => controls.handlePlaceClick(SHELF)}
              />
            }
          >
            <StageContent
              experiment={experiment}
              layout={layout}
              lab={lab}
              controls={controls}
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
