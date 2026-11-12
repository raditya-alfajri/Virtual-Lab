import AssetSvg from './AssetSvg'
import { METAL, OUTLINE, RED, SLATE } from './svg-style'
import type { AssetProps } from './types'

const GREEN = '#7FE3C5'

/**
 * F1 motion sensor: a head on a post; its beam crosses the track at the
 * box's centre line. The lens turns green once the cart has passed.
 */
export default function MotionSensor({ view }: AssetProps) {
  const triggered = view.active === true
  return (
    <AssetSvg width={60} height={160}>
      <line
        x1={30}
        y1={40}
        x2={30}
        y2={152}
        stroke={RED}
        strokeWidth={3}
        strokeDasharray="6 6"
        opacity={triggered ? 0.9 : 0.45}
      />
      <rect x={8} y={36} width={8} height={116} fill={METAL} {...OUTLINE} />
      <rect
        x={4}
        y={146}
        width={20}
        height={10}
        rx={3}
        fill={SLATE}
        {...OUTLINE}
      />
      <rect
        x={4}
        y={6}
        width={52}
        height={32}
        rx={6}
        fill={SLATE}
        {...OUTLINE}
      />
      <circle
        cx={30}
        cy={22}
        r={7}
        fill={triggered ? GREEN : RED}
        {...OUTLINE}
      />
    </AssetSvg>
  )
}
