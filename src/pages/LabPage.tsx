import { Link, useParams } from 'react-router'
import LabStage from '../components/lab/LabStage'
import { getExperiment } from '../lib/experiments'
import { getBackgroundUrl, getSceneLayout } from '../simulations'

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
      <LabStage background={getBackgroundUrl(experiment.id)} />
    </div>
  )
}
