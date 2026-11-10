import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import { GLASS, INK, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

const SHAPE =
  'M24 70 Q24 56 38 56 H72 Q86 56 86 70 V150 Q86 162 74 162 H36 Q24 162 24 150 Z'
const NOZZLE = 'M55 40 V22 Q55 12 66 12 H96 L104 20'
const DEFAULT_LEVEL = 0.62

export default function WashBottle({ view }: AssetProps) {
  return (
    <AssetSvg width={110} height={170}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={110}
        height={170}
        bottom={162}
        top={56}
        level={view.level ?? DEFAULT_LEVEL}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <rect
        x="40"
        y="40"
        width="30"
        height="18"
        rx="3"
        fill="#5B8DEF"
        {...OUTLINE}
      />
      <path d={NOZZLE} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d={NOZZLE} stroke={GLASS} strokeWidth={2.5} strokeLinecap="round" />
      <line x1="33" y1="70" x2="33" y2="146" {...SHINE} />
    </AssetSvg>
  )
}
