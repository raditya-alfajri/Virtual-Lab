import { useState } from 'react'
import { Link, useParams } from 'react-router'
import LabBench from '../components/lab/LabBench'
import LabTitleBar from '../components/lab/LabTitleBar'
import MobileLabBench from '../components/lab/mobile/MobileLabBench'
import { useCompactLayout } from '../components/lab/mobile/use-media-query'
import ResetDialog from '../components/lab/ResetDialog'
import type { Experiment } from '../data/types'
import { useExperiment } from '../hooks/useExperiment'
import { getExperiment } from '../lib/experiments'
import { getSceneLayout } from '../simulations'
import type { SceneLayout } from '../simulations/types'

export default function LabPage() {
  const { subject = '', id = '' } = useParams()
  const experiment = getExperiment(subject, id)
  const layout = experiment ? getSceneLayout(experiment.id) : undefined

  if (!experiment || !layout) {
    return (
      <div className="px-6 py-24 text-center">
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
    <LabSession key={experiment.id} experiment={experiment} layout={layout} />
  )
}

function LabSession({
  experiment,
  layout,
}: {
  experiment: Experiment
  layout: SceneLayout
}) {
  const lab = useExperiment(experiment)
  const compact = useCompactLayout()
  const [confirmingReset, setConfirmingReset] = useState(false)

  const requestReset = () => {
    if (lab.rows.length > 0) setConfirmingReset(true)
    else lab.reset()
  }

  const resetDialog = (
    <ResetDialog
      open={confirmingReset}
      onCancel={() => setConfirmingReset(false)}
      onConfirm={() => {
        setConfirmingReset(false)
        lab.reset()
      }}
    />
  )

  if (compact) {
    return (
      <>
        <MobileLabBench
          experiment={experiment}
          layout={layout}
          lab={lab}
          onReset={requestReset}
        />
        {resetDialog}
      </>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-4">
      <LabBench
        experiment={experiment}
        layout={layout}
        lab={lab}
        header={
          <LabTitleBar
            experiment={experiment}
            speed={lab.speed}
            onSpeedChange={lab.setSpeed}
            onReset={requestReset}
          />
        }
      />
      {resetDialog}
    </div>
  )
}
