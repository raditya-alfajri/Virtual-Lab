// Dari src/assets/lab/cuso4-jar.svg (viewBox 100 × 130). Statis.
const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

const CRYSTALS = [
  [26, 90],
  [40, 100],
  [58, 92],
  [70, 104],
  [48, 110],
  [32, 106],
]

export default function Cuso4Jar() {
  return (
    <svg
      viewBox="0 0 100 130"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <rect x={12} y={34} width={76} height={88} rx={12} fill="#EEF6FA" />
      <path
        d="M15 80 Q30 70 45 78 T85 76 V112 Q85 119 78 119 H22 Q15 119 15 112 Z"
        fill="#2F80ED"
      />
      {CRYSTALS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#7FB2F7" />
      ))}
      <rect
        x={8}
        y={16}
        width={84}
        height={20}
        rx={5}
        fill="#7D859C"
        {...OUTLINE}
      />
      <rect
        x={28}
        y={46}
        width={44}
        height={22}
        rx={4}
        fill="#FFFFFF"
        {...OUTLINE}
      />
      <text
        x={50}
        y={62}
        fontSize={12}
        fontWeight={700}
        fill="#2B2D42"
        textAnchor="middle"
        className="font-sans"
      >
        CuSO₄
      </text>
      <rect x={12} y={34} width={76} height={88} rx={12} {...OUTLINE} />
    </svg>
  )
}
