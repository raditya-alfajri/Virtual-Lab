import { PX_PER_M } from '../../../simulations/hooke-law/scale'
import AssetSvg from './AssetSvg'
import { INK, OUTLINE, RED } from './svg-style'
import type { AssetProps } from './types'

// F3 upright ruler: 0 cm at y = 10, 15 px per cm, up to 30 cm. The red
// marker points at the spring's lower end (`view.length`, in metres).
const ZERO = 10
const PER_CM = PX_PER_M / 100
const CM = Array.from({ length: 31 }, (_, i) => i)
const WOOD = '#F0C25F'

export default function Ruler({ view }: AssetProps) {
  const length = Number(view.length)
  const marker = Number.isFinite(length) ? ZERO + length * PX_PER_M : undefined
  return (
    <AssetSvg width={44} height={470}>
      <rect
        x={2}
        y={2}
        width={40}
        height={466}
        rx={4}
        fill={WOOD}
        {...OUTLINE}
      />
      {CM.map((cm) => {
        const y = ZERO + cm * PER_CM
        const major = cm % 5 === 0
        return (
          <g key={cm}>
            <line
              x1={2}
              y1={y}
              x2={major ? 18 : 11}
              y2={y}
              stroke={INK}
              strokeWidth={major ? 2 : 1.5}
            />
            {major && (
              <text
                x={34}
                y={y}
                fill={INK}
                fontSize={11}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-sans"
              >
                {cm}
              </text>
            )}
          </g>
        )
      })}
      {marker !== undefined && (
        <g transform={`translate(0 ${marker})`}>
          <line
            x1={-36}
            y1={0}
            x2={20}
            y2={0}
            stroke={RED}
            strokeWidth={2.5}
            strokeDasharray="4 3"
          />
          <path d="M2 0 L-8 -6 L-8 6 Z" fill={RED} />
        </g>
      )}
    </AssetSvg>
  )
}
