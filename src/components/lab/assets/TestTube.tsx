import { useId } from 'react'
import Liquid from './Liquid'

// Bentuk dan warna dari src/assets/lab/test-tube.svg, dilebarkan agar mengisi
// kotak 80 × 170 di layout (badan 44, mulut 56; aslinya 20 dan 30).
const BODY = 'M18 14 H62 V128 A22 22 0 0 1 18 128 Z'

type Props = { level?: number; color?: string }

export default function TestTube({ level = 0.46, color = '#7CC6D9' }: Props) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 80 170"
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
        width={80}
        top={30}
        bottom={150}
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
        x={12}
        y={8}
        width={56}
        height={9}
        rx={3}
        fill="#D7EAF2"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={28}
        y1={26}
        x2={28}
        y2={124}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
