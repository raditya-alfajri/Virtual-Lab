import { useId } from 'react'
import Liquid from './Liquid'

// Dari src/assets/lab/reagent-bottle.svg (viewBox 90 × 150).
const BODY =
  'M14 62 Q14 48 28 48 H62 Q76 48 76 62 V132 Q76 142 66 142 H24 Q14 142 14 132 Z'

type Props = {
  name: string
  level?: number
  color?: string
  // Warna tutup botol (default oranye seperti SVG aslinya).
  capColor?: string
  // Garis permukaan untuk larutan bening, lihat Liquid.
  meniscus?: string
}

// Nama larutan dipecah jadi paling banyak 2 baris agar muat di label (lebar 42).
function labelLines(name: string): string[] {
  const [first, ...rest] = name.split(' ')
  return rest.length ? [first, rest.join(' ')] : [first]
}

export default function ReagentBottle({
  name,
  level = 0.67,
  color = '#7CC6D9',
  capColor = '#F4A340',
  meniscus,
}: Props) {
  const clipId = useId()
  const lines = labelLines(name)
  return (
    <svg
      viewBox="0 0 90 150"
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
        width={90}
        top={50}
        bottom={142}
        level={level}
        color={color}
        meniscus={meniscus}
      />
      <path
        d={BODY}
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={32}
        y={26}
        width={26}
        height={24}
        fill="#D7EAF2"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={27}
        y={10}
        width={36}
        height={18}
        rx={4}
        fill={capColor}
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g data-layer="label">
        <rect
          x={24}
          y={88}
          width={42}
          height={30}
          rx={4}
          fill="#FFFFFF"
          stroke="#2B2D42"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <text
          x={45}
          y={lines.length === 1 ? 103 : 97.5}
          fill="#2B2D42"
          fontSize={9}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-sans"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={45} dy={i === 0 ? 0 : 11}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
      <line
        x1={22}
        y1={62}
        x2={22}
        y2={128}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
