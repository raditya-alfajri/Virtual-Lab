import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import { GLASS, INK, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

const SHAPE = 'M18 22 H102 V112 Q102 122 92 122 H28 Q18 122 18 112 Z'
const TICKS = [40, 56, 72, 88, 104]

export default function Beaker({ view }: AssetProps) {
  return (
    <AssetSvg width={120} height={134}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={120}
        height={134}
        bottom={122}
        top={40}
        level={view.level}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <path d="M14 18 H106 M18 22 L12 14" {...OUTLINE} />
      {TICKS.map((y, i) => (
        <line
          key={y}
          x1="86"
          y1={y}
          x2={i % 2 === 0 ? 98 : 94}
          y2={y}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <line x1="28" y1="34" x2="28" y2="108" {...SHINE} />
    </AssetSvg>
  )
}
