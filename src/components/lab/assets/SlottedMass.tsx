import AssetSvg from './AssetSvg'
import { amountOf } from './physics-math'
import { INK, ORANGE, OUTLINE } from './svg-style'
import type { AssetProps } from './types'

/** F3 slotted mass, seen from the side. */
export default function SlottedMass({ name }: AssetProps) {
  return (
    <AssetSvg width={60} height={18}>
      <rect
        x={2}
        y={1.5}
        width={56}
        height={15}
        rx={4}
        fill={ORANGE}
        {...OUTLINE}
        strokeWidth={2.5}
      />
      <text
        x={30}
        y={9.5}
        fill={INK}
        fontSize={10}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-sans"
      >
        {amountOf(name)}
      </text>
    </AssetSvg>
  )
}
