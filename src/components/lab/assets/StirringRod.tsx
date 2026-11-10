import { motion } from 'motion/react'
import AssetSvg from './AssetSvg'
import { GLASS, OUTLINE, SHINE } from './svg-style'
import type { AssetProps } from './types'

export default function StirringRod({ view }: AssetProps) {
  return (
    <AssetSvg width={24} height={180}>
      <motion.g
        style={{ originX: 0.5, originY: 0 }}
        initial={false}
        animate={view.active ? { rotate: [0, -6, 6, 0] } : { rotate: 0 }}
        transition={
          view.active
            ? { duration: 1.2, ease: 'easeInOut', repeat: Infinity }
            : { duration: 0.3 }
        }
      >
        <rect
          x="7"
          y="6"
          width="10"
          height="168"
          rx="5"
          fill={GLASS}
          {...OUTLINE}
        />
        <line x1="11" y1="18" x2="11" y2="160" {...SHINE} />
      </motion.g>
    </AssetSvg>
  )
}
