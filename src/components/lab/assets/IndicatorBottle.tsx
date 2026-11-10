import AssetSvg from './AssetSvg'
import { INK, OUTLINE, WHITE } from './svg-style'

const SCALE = ['#E3604F', '#F4A340', '#F2C94C', '#6CC070', '#5B8DEF', '#8E6CD8']

export default function IndicatorBottle() {
  return (
    <AssetSvg width={90} height={160}>
      <path
        d="M14 74 Q14 60 28 60 H62 Q76 60 76 74 V142 Q76 152 66 152 H24 Q14 152 14 142 Z"
        fill="#C9853A"
        {...OUTLINE}
      />
      <rect x="33" y="44" width="24" height="18" fill={WHITE} {...OUTLINE} />
      <path d="M35 44 C30 14 60 14 55 44 Z" fill={INK} {...OUTLINE} />
      <rect
        x="24"
        y="92"
        width="42"
        height="34"
        rx="4"
        fill={WHITE}
        {...OUTLINE}
      />
      {SCALE.map((color, i) => (
        <rect
          key={color}
          x={28 + i * 6}
          y="98"
          width="6"
          height="10"
          fill={color}
        />
      ))}
      <line x1="30" y1="116" x2="60" y2="116" stroke={INK} strokeWidth={2} />
      <line
        x1="22"
        y1="74"
        x2="22"
        y2="138"
        stroke={WHITE}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
      />
    </AssetSvg>
  )
}
