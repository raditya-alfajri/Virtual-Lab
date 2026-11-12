import AssetSvg from './AssetSvg'
import { METAL_DARK, OUTLINE, SLATE, WHITE } from './svg-style'
import type { AssetProps } from './types'

/** F3 mass hanger: a hook ring, a rod, and the plate the masses stack on. */
export default function Hanger(_props: AssetProps) {
  return (
    <AssetSvg width={60} height={110}>
      <circle cx={30} cy={8} r={6} fill={WHITE} {...OUTLINE} />
      <rect
        x={27}
        y={14}
        width={6}
        height={84}
        fill={METAL_DARK}
        {...OUTLINE}
      />
      <rect
        x={4}
        y={96}
        width={52}
        height={11}
        rx={3}
        fill={SLATE}
        {...OUTLINE}
      />
    </AssetSvg>
  )
}
