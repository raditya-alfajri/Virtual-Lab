import { useId } from 'react'
import Liquid from './Liquid'

// Dari src/assets/lab/wash-bottle.svg (viewBox 110 × 170).
const BODY =
  'M24 70 Q24 56 38 56 H72 Q86 56 86 70 V150 Q86 162 74 162 H36 Q24 162 24 150 Z'
const NOZZLE = 'M55 40 V22 Q55 12 66 12 H96 L104 20'

type Props = { level?: number; color?: string }

// Default sama dengan SVG aslinya: permukaan air di y = 96.
export default function WashBottle({ level = 0.63, color = '#7CC6D9' }: Props) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 110 170"
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
        width={110}
        top={58}
        bottom={162}
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
      <rect
        x={40}
        y={40}
        width={30}
        height={18}
        rx={3}
        fill="#5B8DEF"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d={NOZZLE} stroke="#2B2D42" strokeWidth={7} strokeLinecap="round" />
      <path
        d={NOZZLE}
        stroke="#EEF6FA"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1={33}
        y1={70}
        x2={33}
        y2={146}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
