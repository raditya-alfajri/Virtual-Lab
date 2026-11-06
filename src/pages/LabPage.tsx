import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import LabScene from '../components/lab/LabScene'
import MobileLab from '../components/lab/mobile/MobileLab'
import {
  ExplanationPanel,
  ObservationTable,
} from '../components/lab/ObservationPanels'
import { PHONE_QUERY, useMediaQuery } from '../components/lab/useMediaQuery'
import type { Experiment } from '../data/types'
import { useExperiment } from '../hooks/useExperiment'
import { getExperiment } from '../lib/experiments'
import { getSceneLayout } from '../simulations'
import type { SceneLayout } from '../simulations/types'

const SPEEDS = [1, 5]

export default function LabPage() {
  const { subject = '', id = '' } = useParams()
  const exp = getExperiment(subject, id)

  if (!exp) {
    const catalog =
      subject === 'kimia' || subject === 'fisika' ? `/lab/${subject}` : '/lab'
    return (
      <Notice
        title="Eksperimen tidak ditemukan"
        text="Tautan yang kamu buka tidak cocok dengan eksperimen mana pun."
        to={catalog}
        action="Kembali ke katalog"
      />
    )
  }

  const layout = getSceneLayout(exp.id)
  if (!layout) {
    return (
      <Notice
        title={exp.title}
        text="Tampilan lab sedang disiapkan. Coba lagi nanti, ya."
        to={`/lab/${exp.subject}/${exp.id}`}
        action="Kembali ke detail eksperimen"
      />
    )
  }

  return <Lab key={exp.id} exp={exp} layout={layout} />
}

function Lab({ exp, layout }: { exp: Experiment; layout: SceneLayout }) {
  const [speed, setSpeed] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const lab = useExperiment(exp, speed)
  // Mode HP hanya untuk eksperimen yang punya area kerja HP.
  const phone = useMediaQuery(PHONE_QUERY) && layout.mobile !== undefined

  const reset = () => {
    lab.reset()
    setSelected(null)
  }

  if (phone) {
    return (
      <MobileLab
        exp={exp}
        lab={lab}
        layout={layout}
        speeds={SPEEDS}
        speed={speed}
        onSpeed={setSpeed}
        selected={selected}
        onSelect={setSelected}
        onReset={reset}
      />
    )
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
        <div className="min-w-0 space-y-3">
          <header className="flex flex-wrap items-center gap-2">
            <Link
              to={`/lab/${exp.subject}/${exp.id}`}
              aria-label="Kembali ke detail eksperimen"
              className="rounded-full p-1.5 text-ink-muted hover:bg-primary-tint hover:text-primary"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="mr-auto font-heading text-xl font-bold md:text-2xl">
              {exp.title}
            </h1>
            <div
              role="group"
              aria-label="Kecepatan waktu"
              className="flex items-center gap-1 rounded-full border border-line bg-white p-1 text-sm"
            >
              <span className="px-2 text-ink-muted">Kecepatan</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  aria-pressed={s === speed}
                  className={`rounded-full px-3 py-0.5 font-medium ${s === speed ? 'bg-primary text-white' : 'text-ink hover:bg-primary-tint'}`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </header>

          <LabScene
            exp={exp}
            lab={lab}
            layout={layout}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <aside className="space-y-4">
          <ExplanationPanel explanation={lab.explanation} />
          <ObservationTable
            columns={lab.columns}
            rows={lab.observationRows}
            onRemove={lab.removeRow}
          />
        </aside>
      </div>
    </div>
  )
}

function Notice({
  title,
  text,
  to,
  action,
}: {
  title: string
  text: string
  to: string
  action: string
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      <p className="text-ink-muted">{text}</p>
      <Link
        to={to}
        className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        {action}
      </Link>
    </div>
  )
}
