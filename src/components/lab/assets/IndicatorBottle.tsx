// Dari src/assets/lab/indicator-bottle.svg (viewBox 90 × 160). Statis.
const SWATCHES = [
  '#E3604F',
  '#F4A340',
  '#F2C94C',
  '#6CC070',
  '#5B8DEF',
  '#8E6CD8',
]

export default function IndicatorBottle() {
  return (
    <svg
      viewBox="0 0 90 160"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <path
        d="M14 74 Q14 60 28 60 H62 Q76 60 76 74 V142 Q76 152 66 152 H24 Q14 152 14 142 Z"
        fill="#C9853A"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={33}
        y={44}
        width={24}
        height={18}
        fill="#FFFFFF"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M35 44 C30 14 60 14 55 44 Z"
        fill="#2B2D42"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={24}
        y={92}
        width={42}
        height={34}
        rx={4}
        fill="#FFFFFF"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {SWATCHES.map((fill, i) => (
        <rect
          key={fill}
          x={28 + i * 6}
          y={98}
          width={6}
          height={10}
          fill={fill}
        />
      ))}
      <line
        x1={30}
        y1={116}
        x2={60}
        y2={116}
        stroke="#2B2D42"
        strokeWidth={2}
      />
      <line
        x1={22}
        y1={74}
        x2={22}
        y2={138}
        stroke="#FFFFFF"
        strokeWidth={3}
        opacity={0.5}
        strokeLinecap="round"
      />
    </svg>
  )
}
