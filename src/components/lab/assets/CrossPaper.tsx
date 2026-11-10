import { motion } from 'motion/react'
import { clampUnit } from './asset-math'
import AssetSvg from './AssetSvg'
import { EASE, INK, OUTLINE, WHITE } from './svg-style'
import type { AssetProps } from './types'

export default function CrossPaper({ view }: AssetProps) {
  const visibility =
    view.visibility === undefined ? 1 : clampUnit(view.visibility)
  return (
    <AssetSvg width={150} height={96}>
      <rect
        x="6"
        y="6"
        width="138"
        height="84"
        rx="6"
        fill={WHITE}
        {...OUTLINE}
      />
      <motion.g
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: visibility }}
        transition={EASE}
      >
        <line x1="50" y1="22" x2="100" y2="74" />
        <line x1="100" y1="22" x2="50" y2="74" />
      </motion.g>
    </AssetSvg>
  )
}
