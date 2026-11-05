import { useId } from 'react'
import Liquid from './Liquid'

// Dari src/assets/lab/dropper.svg (viewBox 44 × 180).
const BODY = 'M16 60 H28 V146 L23 172 H21 L16 146 Z'

type Props = { level?: number; color?: string }

export default function Dropper({ level = 0.2, color = '#7CC6D9' }: Props) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 44 180"
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
        width={44}
        top={64}
        bottom={172}
        level={level}
        color={color}
      />
      <path
        d={BODY}
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M10 30 C10 6 34 6 34 30 V52 H10 Z"
        fill="#E3604F"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={12}
        y={50}
        width={20}
        height={10}
        rx={2}
        fill="#4B5468"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={16}
        y1={18}
        x2={16}
        y2={40}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
