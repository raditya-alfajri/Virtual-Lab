import { Link, useParams } from 'react-router'
import LabAsset from '../components/lab/LabAsset'
import LabStage from '../components/lab/LabStage'
import type { Experiment } from '../data/types'
import { useExperiment } from '../hooks/useExperiment'
import { getExperiment } from '../lib/experiments'
import { getBackgroundUrl, getSceneLayout } from '../simulations'
import { attachDepth, resolveItemRect } from '../simulations/position'
import type { SceneLayout } from '../simulations/types'

export default function LabPage() {
  const { subject = '', id = '' } = useParams()
  const experiment = getExperiment(subject, id)
  const layout = experiment ? getSceneLayout(experiment.id) : undefined

  if (!experiment || !layout) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="text-ink-muted">
          {experiment
            ? 'Meja lab untuk praktikum ini belum tersedia.'
            : 'Praktikum tidak ditemukan.'}
        </p>
        <Link
          to="/lab"
          className="mt-4 inline-block font-semibold text-primary"
        >
          Kembali ke daftar laboratorium
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <LabSession key={experiment.id} experiment={experiment} layout={layout} />
    </div>
  )
}

function LabSession({
  experiment,
  layout,
}: {
  experiment: Experiment
  layout: SceneLayout
}) {
  const { world, view } = useExperiment(experiment)
  const count = experiment.items.length

  return (
    <LabStage background={getBackgroundUrl(experiment.id)}>
      {experiment.items.map((item, index) => {
        const rect = resolveItemRect(layout, world.items, item.id)
        if (!rect) return null
        return (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              // Attached items must sit above every item they could rest on.
              zIndex: attachDepth(world.items, item.id) * count + index,
            }}
          >
            <LabAsset kind={item.kind} name={item.name} view={view[item.id]} />
          </div>
        )
      })}
    </LabStage>
  )
}
