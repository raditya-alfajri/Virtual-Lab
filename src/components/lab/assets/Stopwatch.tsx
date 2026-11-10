import { secondsFromReading, stopwatchHandAngle } from './asset-math'
import AssetSvg from './AssetSvg'
import {
  INK,
  METAL,
  METAL_DARK,
  ORANGE,
  OUTLINE,
  RED,
  WHITE,
} from './svg-style'
import type { AssetProps } from './types'

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30)

export default function Stopwatch({ view }: AssetProps) {
  const reading = view.reading ?? '0,0 s'
  const angle = stopwatchHandAngle(secondsFromReading(reading))
  return (
    <AssetSvg width={130} height={150}>
      <rect
        x="54"
        y={view.active ? 9 : 6}
        width="22"
        height="14"
        rx="3"
        fill={METAL_DARK}
        {...OUTLINE}
      />
      <rect x="60" y="18" width="10" height="10" fill={METAL} {...OUTLINE} />
      <path
        d="M104 30 L114 22"
        stroke={INK}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <circle cx="65" cy="88" r="56" fill={ORANGE} {...OUTLINE} />
      <circle cx="65" cy="88" r="44" fill={WHITE} {...OUTLINE} />
      {TICKS.map((deg) => (
        <line
          key={deg}
          x1="65"
          y1="48"
          x2="65"
          y2={deg % 90 === 0 ? 54 : 51}
          stroke={INK}
          strokeWidth={2}
          transform={`rotate(${deg} 65 88)`}
        />
      ))}
      <line
        x1="65"
        y1="88"
        x2="65"
        y2="56"
        stroke={RED}
        strokeWidth={3}
        strokeLinecap="round"
        transform={`rotate(${angle} 65 88)`}
      />
      <circle cx="65" cy="88" r="4" fill={INK} />
      <rect x="38" y="100" width="54" height="20" rx="4" fill="#1F2433" />
      <text
        x="88"
        y="115"
        fontFamily="JetBrains Mono, Courier New"
        fontSize={12}
        fontWeight={600}
        fill="#7FE3C5"
        textAnchor="end"
      >
        {reading}
      </text>
    </AssetSvg>
  )
}
