import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import { GLASS, GLASS_RIM, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

const SHAPE =
  'M48 14 H72 V52 L104 124 Q108 136 96 136 H24 Q12 136 16 124 L48 52 Z'

export default function Erlenmeyer({ view }: AssetProps) {
  return (
    <AssetSvg width={120} height={146}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={120}
        height={146}
        bottom={136}
        top={60}
        level={view.level}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <rect
        x="44"
        y="8"
        width="32"
        height="9"
        rx="3"
        fill={GLASS_RIM}
        {...OUTLINE}
      />
      <line x1="54" y1="26" x2="54" y2="54" {...SHINE} />
      <path d="M44 66 L30 100" {...SHINE} />
    </AssetSvg>
  )
}
