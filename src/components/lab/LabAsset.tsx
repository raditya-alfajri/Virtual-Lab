import type { Value } from '../../data/types'
import Beaker from './assets/Beaker'
import Cuso4Jar from './assets/Cuso4Jar'
import Dropper from './assets/Dropper'
import GraduatedCylinder from './assets/GraduatedCylinder'
import IndicatorBottle from './assets/IndicatorBottle'
import ReagentBottle from './assets/ReagentBottle'
import Spoon from './assets/Spoon'
import StirringRod from './assets/StirringRod'
import TestTube from './assets/TestTube'
import WashBottle from './assets/WashBottle'
import WatchGlass from './assets/WatchGlass'

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
    case 'cuso4':
      return <Cuso4Jar />
    case 'spoon':
      return <Spoon full={view.full === true} />
    case 'watch-glass':
      return <WatchGlass mass={numberOf(view.mass)} />
    case 'water':
      return <WashBottle />
    case 'cylinder':
      return <GraduatedCylinder level={level} color={color} />
    case 'beaker':
      return <Beaker level={level} color={color} />
    case 'stirrer':
      return <StirringRod stirring={view.stirring === true} />
    default:
      return (
        <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-line bg-white/70 p-1 text-center text-xs text-ink-muted">
          {name}
        </div>
      )
  }
}
