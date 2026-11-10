import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import { GLASS, OUTLINE, RED, SHINE, SLATE } from './svg-style'
import type { AssetProps } from './types'

const SHAPE = 'M16 60 H28 V146 L23 172 H21 L16 146 Z'

export default function Dropper({ view }: AssetProps) {
  return (
    <AssetSvg width={44} height={180}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={44}
        height={180}
        bottom={172}
        top={96}
        level={view.level}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <path d="M10 30 C10 6 34 6 34 30 V52 H10 Z" fill={RED} {...OUTLINE} />
      <rect
        x="12"
        y="50"
        width="20"
        height="10"
        rx="2"
        fill={SLATE}
        {...OUTLINE}
      />
      <line x1="16" y1="18" x2="16" y2="40" {...SHINE} />
    </AssetSvg>
  )
}
