import AssetSvg from './AssetSvg'
import { CRYSTAL, GLASS, INK, METAL_DARK, OUTLINE, WHITE } from './svg-style'

const GRAINS = [
  [26, 90],
  [40, 100],
  [58, 92],
  [70, 104],
  [48, 110],
  [32, 106],
]

export default function Cuso4Jar() {
  return (
    <AssetSvg width={100} height={130}>
      <rect
        x="12"
        y="34"
        width="76"
        height="88"
        rx="12"
        fill={GLASS}
        {...OUTLINE}
      />
      <path
        d="M15 80 Q30 70 45 78 T85 76 V112 Q85 119 78 119 H22 Q15 119 15 112 Z"
        fill={CRYSTAL}
      />
      {GRAINS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#7FB2F7" />
      ))}
      <rect
        x="8"
        y="16"
        width="84"
        height="20"
        rx="5"
        fill={METAL_DARK}
        {...OUTLINE}
      />
      <rect
        x="28"
        y="46"
        width="44"
        height="22"
        rx="4"
        fill={WHITE}
        {...OUTLINE}
      />
      <text
        x="50"
        y="62"
        fontFamily="Inter, Arial"
        fontSize={12}
        fontWeight={700}
        fill={INK}
        textAnchor="middle"
      >
        CuSO₄
      </text>
      <rect x="12" y="34" width="76" height="88" rx="12" {...OUTLINE} />
    </AssetSvg>
  )
}
