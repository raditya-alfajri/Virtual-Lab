import { useId } from 'react'
import Liquid from './Liquid'

// Dari src/assets/lab/erlenmeyer.svg (viewBox 120 × 146).
// Kaca dan cairan dibuat tembus pandang agar tanda silang di kertas di
// bawahnya terlihat menembus labu.
const BODY =
  'M48 14 H72 V52 L104 124 Q108 136 96 136 H24 Q12 136 16 124 L48 52 Z'
const MENISCUS = '#7CC6D9'

type Props = { level?: number; color?: string }

export default function Erlenmeyer({ level = 0, color = '#7CC6D9' }: Props) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 120 146"
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
        <path d={BODY} fill="#EEF6FA" opacity={0.5} />
      </g>
      <g opacity={0.8}>
        <Liquid
          clipId={clipId}
          width={120}
          // Penuh sampai pangkal leher; level 0,5 ≈ permukaan di SVG aslinya.
          top={52}
          bottom={136}
          level={level}
          color={color}
          meniscus={MENISCUS}
        />
      </g>
      <path
        d={BODY}
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={44}
        y={8}
        width={32}
        height={9}
        rx={3}
        fill="#D7EAF2"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={54}
        y1={26}
        x2={54}
        y2={54}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M44 66 L30 100"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
