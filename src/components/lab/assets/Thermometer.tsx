import { motion } from 'motion/react'
import { levelToY } from './asset-math'
import AssetSvg from './AssetSvg'
import { EASE, INK, OUTLINE, RED, SHINE, WHITE } from './svg-style'
import type { AssetProps } from './types'

const COLUMN_BOTTOM = 188
const TICKS = Array.from({ length: 10 }, (_, i) => 24 + i * 15)

export default function Thermometer({ view }: AssetProps) {
  const top = levelToY(view.level, 174, 24)
  return (
    <AssetSvg width={40} height={210}>
      <rect
        x="12"
        y="8"
        width="16"
        height="170"
        rx="8"
        fill={WHITE}
        {...OUTLINE}
      />
      <motion.rect
        x="17"
        width="6"
        rx="3"
        fill={RED}
        initial={false}
        animate={{ attrY: top, height: COLUMN_BOTTOM - top }}
        transition={EASE}
      />
      <circle cx="20" cy="188" r="13" fill={RED} {...OUTLINE} />
      {TICKS.map((y, i) => (
        <line
          key={y}
          x1="28"
          y1={y}
          x2={i % 2 === 0 ? 34 : 31}
          y2={y}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <line x1="16" y1="18" x2="16" y2="80" {...SHINE} />
    </AssetSvg>
  )
}
