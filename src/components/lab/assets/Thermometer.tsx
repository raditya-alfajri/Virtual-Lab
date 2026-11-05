import { motion } from 'motion/react'

// Dari src/assets/lab/thermometer.svg (viewBox 40 × 210).
// Skala: garis panjang tiap 10 °C, 0 °C di y = 159 dan 90 °C di y = 24
// (15 satuan per 10 °C). Kolom merah bermula dari dalam bola (y = 188).
const ZERO_Y = 159
const PER_DEGREE = 1.5
const BULB_Y = 188
const TICKS = [24, 39, 54, 69, 84, 99, 114, 129, 144, 159]

const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

type Props = { temp?: number }

export default function Thermometer({ temp = 25 }: Props) {
  const top = Math.max(ZERO_Y - temp * PER_DEGREE, 14)
  return (
    <svg
      viewBox="0 0 40 210"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <rect
        x={12}
        y={8}
        width={16}
        height={170}
        rx={8}
        fill="#FFFFFF"
        {...OUTLINE}
      />
      <motion.rect
        data-layer="column"
        x={17}
        width={6}
        rx={3}
        fill="#E3604F"
        initial={false}
        animate={{ y: top, height: BULB_Y - top }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <circle cx={20} cy={188} r={13} fill="#E3604F" {...OUTLINE} />
      {TICKS.map((y, i) => (
        <line
          key={y}
          x1={28}
          y1={y}
          x2={i % 2 ? 31 : 34}
          y2={y}
          stroke="#2B2D42"
          strokeWidth={2}
        />
      ))}
      <line
        x1={16}
        y1={18}
        x2={16}
        y2={80}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
