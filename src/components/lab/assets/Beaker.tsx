import { useId } from 'react'
import Liquid from './Liquid'

// Dari src/assets/lab/beaker.svg (viewBox 120 × 134).
// Penuh (level 1) sampai garis skala teratas y = 40.
const BODY = 'M18 22 H102 V112 Q102 122 92 122 H28 Q18 122 18 112 Z'
const TICKS = [40, 56, 72, 88, 104]

// Warna air di SVG aslinya, untuk garis permukaan.
const MENISCUS = '#7CC6D9'

type Props = { level?: number; color?: string }

export default function Beaker({ level = 0, color = '#7CC6D9' }: Props) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 120 134"
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
        width={120}
        top={40}
        bottom={122}
        level={level}
        color={color}
        meniscus={MENISCUS}
      />
      <path
        d={BODY}
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M14 18 H106 M18 22 L12 14"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {TICKS.map((y, i) => (
        <line
          key={y}
          x1={86}
          y1={y}
          x2={i % 2 ? 94 : 98}
          y2={y}
          stroke="#2B2D42"
          strokeWidth={2}
        />
      ))}
      <line
        x1={28}
        y1={34}
        x2={28}
        y2={108}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
