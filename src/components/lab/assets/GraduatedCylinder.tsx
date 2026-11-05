import { useId } from 'react'
import Liquid from './Liquid'

// Dari src/assets/lab/graduated-cylinder.svg (viewBox 64 × 200).
// Skala: dasar y = 170 (0 mL), garis teratas y = 30 (250 mL), tiap 14 = 25 mL.
const BODY = 'M20 16 H40 V170 H20 Z'
const TICKS = [30, 44, 58, 72, 86, 100, 114, 128, 142, 156]

const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

// Warna air di SVG aslinya, untuk garis permukaan.
const MENISCUS = '#7CC6D9'

type Props = { level?: number; color?: string }

export default function GraduatedCylinder({
  level = 0,
  color = '#7CC6D9',
}: Props) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 64 200"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <g data-layer="glass">
        <path d={BODY} fill="#EEF6FA" />
      </g>
      <Liquid
        clipId={clipId}
        width={64}
        top={30}
        bottom={170}
        level={level}
        color={color}
        meniscus={MENISCUS}
      />
      <path d={BODY} {...OUTLINE} />
      <path d="M16 12 H44 L42 18 H18 Z" fill="#D7EAF2" {...OUTLINE} />
      <path d="M8 170 H52 L48 188 H12 Z" fill="#D7EAF2" {...OUTLINE} />
      {TICKS.map((y, i) => (
        <line
          key={y}
          x1={32}
          y1={y}
          x2={i % 2 ? 40 : 36}
          y2={y}
          stroke="#2B2D42"
          strokeWidth={2}
        />
      ))}
      <line
        x1={25}
        y1={28}
        x2={25}
        y2={160}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
