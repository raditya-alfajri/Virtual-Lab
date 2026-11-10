import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import { GLASS, GLASS_RIM, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

const SHAPE = 'M20 16 H60 V136 A20 20 0 0 1 20 136 Z'

export default function TestTube({ view }: AssetProps) {
  return (
    <AssetSvg width={80} height={170}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={80}
        height={170}
        bottom={156}
        top={20}
        level={view.level}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <rect
        x="13"
        y="8"
        width="54"
        height="11"
        rx="4"
        fill={GLASS_RIM}
        {...OUTLINE}
      />
      <line x1="30" y1="28" x2="30" y2="134" {...SHINE} />
      <line
        x1="36"
        y1="28"
        x2="36"
        y2="60"
        {...SHINE}
        strokeWidth={2}
        opacity={0.6}
      />
    </AssetSvg>
  )
}
