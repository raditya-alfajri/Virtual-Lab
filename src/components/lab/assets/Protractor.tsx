import AssetSvg from './AssetSvg'
import { INK } from './svg-style'
import type { AssetProps } from './types'

// F2 protractor: a half circle facing down whose centre (110, 4) sits on the
// string's pivot. 0° points straight down; a tick every 5°, a number every
// 15°, and the safe range up to 15° is shaded.
const CX = 110
const CY = 4
const R = 104

const point = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.sin(rad), y: CY + r * Math.cos(rad) }
}

const TICKS = Array.from({ length: 37 }, (_, i) => -90 + i * 5)
const LABELS = [-45, -30, -15, 0, 15, 30, 45]

export default function Protractor(_props: AssetProps) {
  const a = point(-15, R)
  const b = point(15, R)
  return (
    <AssetSvg width={220} height={118}>
      <path
        d={`M${CX - R} ${CY} A${R} ${R} 0 0 0 ${CX + R} ${CY} Z`}
        fill="#E6F3EF"
        fillOpacity={0.75}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={`M${CX} ${CY} L${a.x} ${a.y} A${R} ${R} 0 0 0 ${b.x} ${b.y} Z`}
        fill="#7FE3C5"
        fillOpacity={0.45}
      />
      {TICKS.map((deg) => {
        const long = deg % 15 === 0
        const p1 = point(deg, R)
        const p2 = point(deg, R - (long ? 14 : 7))
        return (
          <line
            key={deg}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={INK}
            strokeWidth={long ? 2 : 1.5}
          />
        )
      })}
      {LABELS.map((deg) => {
        const p = point(deg, R - 26)
        return (
          <text
            key={deg}
            x={p.x}
            y={p.y}
            fill={INK}
            fontSize={10}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-sans"
          >
            {Math.abs(deg)}
          </text>
        )
      })}
      <circle cx={CX} cy={CY} r={3} fill={INK} />
    </AssetSvg>
  )
}
