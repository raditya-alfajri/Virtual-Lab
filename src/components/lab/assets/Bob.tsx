import { bobDiameter } from '../../../simulations/simple-pendulum/scale'
import AssetSvg from './AssetSvg'
import { firstNumber } from './physics-math'
import { INK, ORANGE, WHITE } from './svg-style'
import type { AssetProps } from './types'

/**
 * F2 bob: a 10-unit hook above a ball whose size follows its mass. The box
 * is d × (d + 10), with the hook point at the top centre.
 */
export default function Bob({ name }: AssetProps) {
  const d = bobDiameter(firstNumber(name))
  const r = d / 2
  return (
    <AssetSvg width={d} height={d + 10}>
      <line
        x1={r}
        y1={0}
        x2={r}
        y2={10}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle
        cx={r}
        cy={10 + r}
        r={r - 1.5}
        fill={ORANGE}
        stroke={INK}
        strokeWidth={3}
      />
      <ellipse
        cx={r * 0.7}
        cy={10 + r * 0.7}
        rx={r * 0.22}
        ry={r * 0.3}
        fill={WHITE}
        opacity={0.7}
        transform={`rotate(35 ${r * 0.7} ${10 + r * 0.7})`}
      />
    </AssetSvg>
  )
}
