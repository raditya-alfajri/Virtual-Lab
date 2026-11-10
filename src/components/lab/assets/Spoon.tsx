import { motion } from 'motion/react'
import { clampUnit } from './asset-math'
import AssetSvg from './AssetSvg'
import { CRYSTAL, EASE, METAL, METAL_DARK, OUTLINE } from './svg-style'
import type { AssetProps } from './types'

export default function Spoon({ view }: AssetProps) {
  const filled = clampUnit(view.level) > 0
  return (
    <AssetSvg width={160} height={50}>
      <rect
        x="44"
        y="20"
        width="110"
        height="10"
        rx="5"
        fill={METAL}
        {...OUTLINE}
      />
      <ellipse cx="26" cy="25" rx="20" ry="13" fill={METAL} {...OUTLINE} />
      <ellipse cx="26" cy="25" rx="13" ry="7" fill={METAL_DARK} />
      <motion.ellipse
        cx="26"
        cy="23"
        rx="12"
        ry="6"
        initial={false}
        animate={{ opacity: filled ? 1 : 0, fill: view.color ?? CRYSTAL }}
        transition={EASE}
      />
    </AssetSvg>
  )
}
