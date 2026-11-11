import { motion } from 'motion/react'
import AssetSvg from './AssetSvg'
import { GLASS, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

/** Drawn lying down; the scene turns it upright when it stands in a beaker. */
export default function StirringRod({ view }: AssetProps) {
  return (
    <AssetSvg width={180} height={24}>
      <motion.g
        style={{ originX: 0, originY: 0.5 }}
        initial={false}
        animate={view.active ? { rotate: [0, -6, 6, 0] } : { rotate: 0 }}
        transition={
          view.active
            ? { duration: 1.2, ease: 'easeInOut', repeat: Infinity }
            : { duration: 0.3 }
        }
      >
        <rect
          x="6"
          y="7"
          width="168"
          height="10"
          rx="5"
          fill={GLASS}
          {...OUTLINE}
        />
        <line x1="18" y1="11" x2="160" y2="11" {...SHINE} />
      </motion.g>
    </AssetSvg>
  )
}
