import AssetSvg from './AssetSvg'
import { firstNumber, amountOf } from './physics-math'
import { INK, METAL, OUTLINE, SLATE, WHITE } from './svg-style'
import type { AssetProps } from './types'

/** F1 weight block: 0.5 kg is short and light grey, 1 kg is taller and dark. */
export default function WeightBlock({ name }: AssetProps) {
  const heavy = firstNumber(name) >= 1
  const h = heavy ? 36 : 26
  return (
    <AssetSvg width={56} height={h}>
      <rect
        x={2}
        y={2}
        width={52}
        height={h - 4}
        rx={4}
        fill={heavy ? SLATE : METAL}
        {...OUTLINE}
      />
      <text
        x={28}
        y={h / 2 + 1}
        fill={heavy ? WHITE : INK}
        fontSize={12}
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
