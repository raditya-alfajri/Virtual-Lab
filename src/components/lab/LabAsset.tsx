import type { Value } from '../../data/types'
import Beaker from './assets/Beaker'
import CrossPaper from './assets/CrossPaper'
import Cuso4Jar from './assets/Cuso4Jar'
import Dropper from './assets/Dropper'
import Erlenmeyer from './assets/Erlenmeyer'
import GraduatedCylinder from './assets/GraduatedCylinder'
import IndicatorBottle from './assets/IndicatorBottle'
import ReagentBottle from './assets/ReagentBottle'
import Spoon from './assets/Spoon'
import Stopwatch from './assets/Stopwatch'
import StirringRod from './assets/StirringRod'
import TestTube from './assets/TestTube'
import Thermometer from './assets/Thermometer'
import WashBottle from './assets/WashBottle'
import WatchGlass from './assets/WatchGlass'
import WaterBath from './assets/WaterBath'

// Larutan bening (Na₂S₂O₃, HCl): sedikit kebiruan dengan garis permukaan,
// agar tidak hilang di kaca botol.
const CLEAR_LIQUID = '#D7EAF2'
const MENISCUS = '#7CC6D9'
const HCL_CAP = '#E3604F'

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
    case 'flask':
      return <Erlenmeyer level={level} color={color} />
    case 'paper':
      return <CrossPaper visibility={numberOf(view.visibility)} />
    case 'bath':
      return <WaterBath on={view.on === true} />
    case 'thermometer':
      return <Thermometer temp={numberOf(view.temp)} />
    case 'stopwatch':
      return (
        <Stopwatch
          elapsed={numberOf(view.elapsed)}
          reading={stringOf(view.reading)}
        />
      )
    case 'thiosulfate':
    case 'hcl':
      return (
        <ReagentBottle
          name={name}
          color={CLEAR_LIQUID}
          meniscus={MENISCUS}
          capColor={kind === 'hcl' ? HCL_CAP : undefined}
        />
      )
    default:
      return (
        <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-line bg-white/70 p-1 text-center text-xs text-ink-muted">
          {name}
        </div>
      )
  }
}
