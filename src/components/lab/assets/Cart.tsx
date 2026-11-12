import AssetSvg from './AssetSvg'
import { INK, LIQUID, METAL, OUTLINE, SLATE, WHITE } from './svg-style'
import type { AssetProps } from './types'

/** F1 cart: a body on two wheels that stand on the rail. */
export default function Cart({ view }: AssetProps) {
  return (
    <AssetSvg width={150} height={72}>
      <rect x={6} y={10} width={138} height={38} rx={8} fill={LIQUID} />
      <rect x={6} y={10} width={138} height={9} rx={4} fill={SLATE} />
      <rect x={6} y={10} width={138} height={38} rx={8} {...OUTLINE} />
      <line
        x1={20}
        y1={30}
        x2={60}
        y2={30}
        stroke={WHITE}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Speed lines behind the cart while it rolls. */}
      {view.moving === true && (
        <g stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.5}>
          <line x1={-30} y1={22} x2={-8} y2={22} />
          <line x1={-40} y1={34} x2={-8} y2={34} />
        </g>
      )}
      {[34, 116].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={57} r={12} fill={SLATE} {...OUTLINE} />
          <circle cx={cx} cy={57} r={4} fill={METAL} />
        </g>
      ))}
    </AssetSvg>
  )
}
