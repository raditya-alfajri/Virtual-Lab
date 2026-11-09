import { useState } from 'react'
import { Link, useParams } from 'react-router'
import LabBench from '../components/lab/LabBench'
import LabHeader from '../components/lab/LabHeader'
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
      <div className="grid min-h-dvh place-items-center p-8 text-center">
        <div>
          <Link to="/" className="font-heading text-lg font-extrabold">
            virtual lab.
          </Link>
          <p className="mt-6 text-ink-muted">
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
  const [confirmingReset, setConfirmingReset] = useState(false)

  const requestReset = () => {
    if (lab.rows.length > 0) setConfirmingReset(true)
    else lab.reset()
  }

  return (
    <div className="flex h-dvh flex-col">
      <LabHeader
        experiment={experiment}
        speed={lab.speed}
        onSpeedChange={lab.setSpeed}
        onReset={requestReset}
      />
      <main className="relative min-h-0 flex-1">
        <LabBench experiment={experiment} layout={layout} lab={lab} />
      </main>
      <ResetDialog
        open={confirmingReset}
        onCancel={() => setConfirmingReset(false)}
        onConfirm={() => {
          setConfirmingReset(false)
          lab.reset()
        }}
      />
    </div>
  )
}
