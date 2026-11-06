import { useEffect } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { Experiment } from '../../../data/types'
import type { useExperiment } from '../../../hooks/useExperiment'
import type { SceneLayout } from '../../../simulations/types'
import LabScene from '../LabScene'
import { LANDSCAPE_QUERY, useMediaQuery } from '../useMediaQuery'
import BottomSheet from './BottomSheet'
import ResultsPanel from './ResultsPanel'
import RotateTip from './RotateTip'
import { markRotateTipSeen } from './rotateTipStorage'

type Props = {
  exp: Experiment
  lab: ReturnType<typeof useExperiment>
  layout: SceneLayout
  speeds: number[]
  speed: number
  onSpeed: (speed: number) => void
  selected: string | null
  onSelect: (id: string | null) => void
  onReset: () => void
}

// Halaman praktikum di HP: layar penuh, satu area kerja pada satu waktu.
// Potret: tabel di panel bawah. Lanskap: tabel ringkas di sisi kanan.
export default function MobileLab(props: Props) {
  const { exp, lab, layout, selected, onSelect } = props
  const landscape = useMediaQuery(LANDSCAPE_QUERY)

  // Halaman di belakang lapisan layar penuh tidak ikut tergulir.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Siswa yang sudah memutar HP tidak perlu petunjuknya lagi.
  useEffect(() => {
    if (landscape) markRotateTipSeen()
  }, [landscape])

  const rows = lab.observationRows.length
  const summary = rows ? `${rows} baris data` : 'Belum ada data'
  const results = (
    <ResultsPanel
      columns={lab.columns}
      rows={lab.observationRows}
      explanation={lab.explanation}
      onRemove={lab.removeRow}
    />
  )

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-bg">
      <TopBar {...props} />
      {!landscape && <RotateTip />}
      <div
        className={
          landscape
            ? 'flex min-h-0 flex-1'
            : 'relative flex min-h-0 flex-1 flex-col pb-14'
        }
      >
        {/* Posisi LabScene sama di kedua orientasi agar tidak dipasang ulang
            saat HP diputar. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <LabScene
            exp={exp}
            lab={lab}
            layout={layout}
            selected={selected}
            onSelect={onSelect}
            views={layout.mobile?.views}
            landscape={landscape}
          />
        </div>
        {landscape ? (
          <aside
            aria-label="Hasil praktikum"
            className="flex w-56 shrink-0 flex-col border-l border-line bg-white pt-1"
          >
            {results}
          </aside>
        ) : (
          <BottomSheet title="Hasil" summary={summary}>
            {results}
          </BottomSheet>
        )}
      </div>
    </div>
  )
}

function TopBar({ exp, speeds, speed, onSpeed, onReset }: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-white pr-1">
      <Link
        to={`/lab/${exp.subject}/${exp.id}`}
        aria-label="Kembali ke detail eksperimen"
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-primary-tint hover:text-primary"
      >
        <ArrowLeft size={20} />
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-heading text-base font-bold">
        {exp.title}
      </h1>
      <div
        role="group"
        aria-label="Kecepatan waktu"
        className="flex shrink-0 rounded-full border border-line p-0.5 text-sm"
      >
        {speeds.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            aria-pressed={s === speed}
            className={`h-10 min-w-11 rounded-full px-2 font-medium ${s === speed ? 'bg-primary text-white' : 'text-ink hover:bg-primary-tint'}`}
          >
            {s}×
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset praktikum"
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-primary-tint hover:text-primary"
      >
        <RotateCcw size={20} />
      </button>
    </header>
  )
}
