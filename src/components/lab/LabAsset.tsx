import clsx from 'clsx'
import type { ComponentType, ReactNode } from 'react'
import type { ItemView } from '../../data/types'
import type { LabelSide } from '../../simulations/types'
import AssetLabel from './assets/AssetLabel'
import Beaker from './assets/Beaker'
import CrossPaper from './assets/CrossPaper'
import Cuso4Jar from './assets/Cuso4Jar'
import Dropper from './assets/Dropper'
import Erlenmeyer from './assets/Erlenmeyer'
import GraduatedCylinder from './assets/GraduatedCylinder'
import IndicatorBottle from './assets/IndicatorBottle'
import ReadingDisplay from './assets/ReadingDisplay'
import ReagentBottle from './assets/ReagentBottle'
import Spoon from './assets/Spoon'
import StirringRod from './assets/StirringRod'
import Stopwatch from './assets/Stopwatch'
import { RED } from './assets/svg-style'
import TestTube from './assets/TestTube'
import Thermometer from './assets/Thermometer'
import type { AssetProps } from './assets/types'
import WashBottle from './assets/WashBottle'
import WatchGlass from './assets/WatchGlass'
import WaterBath from './assets/WaterBath'

type AssetEntry = {
  component: ComponentType<AssetProps>
  /** The drawing shows the label itself, as on a bottle sticker. */
  ownLabel?: boolean
  /** The drawing shows the reading on its own screen. */
  ownReading?: boolean
}

function HclBottle(props: AssetProps) {
  return <ReagentBottle {...props} capColor={RED} />
}

function ThioBottle(props: AssetProps) {
  return <ReagentBottle {...props} title="Na₂S₂O₃" />
}

const ASSETS: Partial<Record<string, AssetEntry>> = {
  tube: { component: TestTube },
  pipette: { component: Dropper },
  indicator: { component: IndicatorBottle },
  bottle: { component: ReagentBottle, ownLabel: true },
  thio: { component: ThioBottle, ownLabel: true },
  hcl: { component: HclBottle, ownLabel: true },
  cuso4: { component: Cuso4Jar },
  spoon: { component: Spoon },
  'watch-glass': { component: WatchGlass },
  water: { component: WashBottle },
  cylinder: { component: GraduatedCylinder },
  beaker: { component: Beaker },
  stirrer: { component: StirringRod },
  flask: { component: Erlenmeyer },
  thermometer: { component: Thermometer },
  stopwatch: { component: Stopwatch, ownReading: true },
  bath: { component: WaterBath },
  paper: { component: CrossPaper },
}

/** The drawing's own size and how far it is turned inside the item's box. */
export type AssetTurn = { w: number; h: number; rotate: number }

type Props = {
  kind: string
  name: string
  view?: ItemView
  turn?: AssetTurn
  labelSide?: LabelSide
  /** False when the reading is shown elsewhere, e.g. on a screen in the scene. */
  showReading?: boolean
}

export default function LabAsset({
  kind,
  name,
  view = {},
  turn,
  labelSide,
  showReading = true,
}: Props) {
  const entry = ASSETS[kind]
  if (!entry) {
    return (
      <Turned turn={turn}>
        <PlaceholderAsset name={name} view={view} />
      </Turned>
    )
  }
  const { component: Asset, ownLabel, ownReading } = entry
  return (
    <div className="relative size-full">
      <Turned turn={turn}>
        <Asset name={name} view={view} />
      </Turned>
      {!ownLabel && view.label !== undefined && (
        <AssetLabel text={view.label} side={labelSide} />
      )}
      {showReading && !ownReading && view.reading !== undefined && (
        <ReadingDisplay text={view.reading} />
      )}
    </div>
  )
}

function Turned({ turn, children }: { turn?: AssetTurn; children: ReactNode }) {
  if (!turn) return children
  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{
        width: turn.w,
        height: turn.h,
        transform: `translate(-50%, -50%) rotate(${turn.rotate}deg)`,
      }}
    >
      {children}
    </div>
  )
}

function PlaceholderAsset({ name, view }: AssetProps) {
  const level = Math.min(1, Math.max(0, view.level ?? 0))
  return (
    <div className="relative size-full">
      <div
        className={clsx(
          'relative size-full overflow-hidden rounded-lg border-2 border-ink bg-bg/80',
          view.active && 'ring-4 ring-primary',
        )}
      >
        {level > 0 && (
          <div
            className={clsx(
              'absolute inset-x-0 bottom-0',
              !view.color && 'bg-primary-tint',
            )}
            style={{
              height: `${level * 100}%`,
              backgroundColor: view.color,
            }}
          />
        )}
        {view.visibility !== undefined && (
          <span
            className="absolute inset-0 grid place-items-center text-6xl font-bold text-ink"
            style={{ opacity: Number(view.visibility) }}
          >
            ✕
          </span>
        )}
      </div>
      {view.reading !== undefined && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-ink px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-bg">
          {view.reading}
        </span>
      )}
      <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 text-center text-xs leading-tight font-medium whitespace-nowrap text-ink">
        {view.label ?? name}
      </span>
    </div>
  )
}
