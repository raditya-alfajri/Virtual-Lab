import type { Value } from '../../data/types'
import Dropper from './assets/Dropper'
import IndicatorBottle from './assets/IndicatorBottle'
import ReagentBottle from './assets/ReagentBottle'
import TestTube from './assets/TestTube'

type Props = {
  kind: string
  name: string
  view?: Record<string, Value>
}

const numberOf = (v: Value | undefined) =>
  v === undefined ? undefined : Number(v)
const stringOf = (v: Value | undefined) =>
  v === undefined ? undefined : String(v)

// Memetakan kind benda di data eksperimen ke gambar asetnya.
// Mengisi penuh kotak induknya, jadi ukuran ditentukan oleh pemanggil.
export default function LabAsset({ kind, name, view = {} }: Props) {
  const level = numberOf(view.level)
  const color = stringOf(view.color)

  switch (kind) {
    case 'tube':
      return <TestTube level={level} color={color} />
    case 'pipette':
      return <Dropper level={level} color={color} />
    case 'solution':
      return <ReagentBottle name={name} level={level} color={color} />
    case 'indicator':
      return <IndicatorBottle />
    default:
      return (
        <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-line bg-white/70 p-1 text-center text-xs text-ink-muted">
          {name}
        </div>
      )
  }
}
