import { motion } from 'motion/react'
import { clampUnit } from './asset-math'
import AssetSvg from './AssetSvg'
import { CRYSTAL, EASE, GLASS, GLASS_RIM, OUTLINE, WHITE } from './svg-style'
import type { AssetProps } from './types'

const MIN_PILE = 0.35

export default function WatchGlass({ view }: AssetProps) {
  const level = clampUnit(view.level)
  const pile = level > 0 ? MIN_PILE + (1 - MIN_PILE) * level : 0
  return (
    <AssetSvg width={150} height={80}>
      <path d="M10 30 Q75 82 140 30" fill={GLASS_RIM} {...OUTLINE} />
      <ellipse cx="75" cy="30" rx="65" ry="16" fill={GLASS} {...OUTLINE} />
      <ellipse cx="75" cy="31" rx="50" ry="10" fill={WHITE} opacity={0.7} />
      <motion.path
        d="M52 34 Q75 14 98 34 Z"
        style={{ originX: 0.5, originY: 1 }}
        initial={false}
        animate={{
          scale: pile,
          opacity: level > 0 ? 1 : 0,
          fill: view.color ?? CRYSTAL,
        }}
        transition={EASE}
      />
      <path
        d="M28 44 Q50 60 74 63"
        stroke={WHITE}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d="M30 26 Q44 20 60 19"
        stroke={WHITE}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </AssetSvg>
  )
}
