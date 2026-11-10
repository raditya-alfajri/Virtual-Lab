import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import { GLASS, GLASS_RIM, INK, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

const SHAPE = 'M20 16 H40 V170 H20 Z'
const TICKS = Array.from({ length: 10 }, (_, i) => 30 + i * 14)

export default function GraduatedCylinder({ view }: AssetProps) {
  return (
    <AssetSvg width={64} height={200}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={64}
        height={200}
        bottom={170}
        top={30}
        level={view.level}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <path d="M16 12 H44 L42 18 H18 Z" fill={GLASS_RIM} {...OUTLINE} />
      <path d="M8 170 H52 L48 188 H12 Z" fill={GLASS_RIM} {...OUTLINE} />
      {TICKS.map((y, i) => (
        <line
          key={y}
          x1="32"
          y1={y}
          x2={i % 2 === 0 ? 36 : 40}
          y2={y}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <line x1="25" y1="28" x2="25" y2="160" {...SHINE} />
    </AssetSvg>
  )
}
