import { SCREEN_FONT, SCREEN_TEXT } from './Readout'

// Dari src/assets/lab/stopwatch.svg (viewBox 130 × 150).
const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30)

type Props = { elapsed?: number; reading?: string }

export default function Stopwatch({ elapsed = 0, reading = '0,00 s' }: Props) {
  // Jarum satu putaran per 60 s. Nilai `elapsed` berubah tiap frame saat
  // stopwatch berjalan, jadi jarum diputar langsung tanpa animasi tambahan.
  const angle = (elapsed % 60) * 6
  return (
    <svg
      viewBox="0 0 130 150"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <rect
        x={54}
        y={6}
        width={22}
        height={14}
        rx={3}
        fill="#7D859C"
        {...OUTLINE}
      />
      <rect x={60} y={18} width={10} height={10} fill="#B3BACB" {...OUTLINE} />
      <path
        d="M104 30 L114 22"
        stroke="#2B2D42"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <circle cx={65} cy={88} r={56} fill="#F4A340" {...OUTLINE} />
      <circle cx={65} cy={88} r={44} fill="#FFFFFF" {...OUTLINE} />
      {TICKS.map((deg) => (
        <line
          key={deg}
          x1={65}
          y1={48}
          x2={65}
          y2={deg % 90 ? 51 : 54}
          stroke="#2B2D42"
          strokeWidth={2}
          transform={`rotate(${deg} 65 88)`}
        />
      ))}
      <line
        data-layer="hand"
        x1={65}
        y1={88}
        x2={65}
        y2={56}
        stroke="#E3604F"
        strokeWidth={3}
        strokeLinecap="round"
        transform={`rotate(${angle} 65 88)`}
      />
      <circle cx={65} cy={88} r={4} fill="#2B2D42" />
      <rect x={38} y={100} width={54} height={20} rx={4} fill="#1F2433" />
      <text
        data-layer="reading"
        x={88}
        y={115}
        fill={SCREEN_TEXT}
        fontFamily={SCREEN_FONT}
        // Bacaan panjang (mis. 240,00 s) dikecilkan agar tetap muat di layar.
        fontSize={reading.length > 7 ? 10 : 12}
        fontWeight={600}
        textAnchor="end"
      >
        {reading}
      </text>
    </svg>
  )
}
