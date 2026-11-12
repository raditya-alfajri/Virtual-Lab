import { motion } from 'motion/react'
import AssetSvg from './AssetSvg'
import { amountOf } from './physics-math'
import {
  GLASS,
  INK,
  LIQUID,
  METAL_DARK,
  OUTLINE,
  SLATE,
  WHITE,
} from './svg-style'
import type { AssetProps } from './types'

/** F1 push fan: blades in a guard on a post, its force written on the base. */
export default function Fan({ name, view }: AssetProps) {
  const spinning = view.active === true
  return (
    <AssetSvg width={80} height={90}>
      <rect
        x={36}
        y={60}
        width={8}
        height={16}
        fill={METAL_DARK}
        {...OUTLINE}
      />
      <rect
        x={8}
        y={72}
        width={64}
        height={16}
        rx={4}
        fill={SLATE}
        {...OUTLINE}
      />
      <text
        x={40}
        y={81}
        fill={WHITE}
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-sans"
      >
        {amountOf(name)}
      </text>
      <circle cx={40} cy={34} r={30} fill={GLASS} {...OUTLINE} />
      <motion.g
        style={{ originX: '40px', originY: '34px' }}
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={
          spinning
            ? { duration: 0.35, ease: 'linear', repeat: Infinity }
            : { duration: 0 }
        }
      >
        {[0, 120, 240].map((deg) => (
          <ellipse
            key={deg}
            cx={40}
            cy={19}
            rx={7}
            ry={14}
            fill={LIQUID}
            stroke={INK}
            strokeWidth={2}
            transform={`rotate(${deg} 40 34)`}
          />
        ))}
      </motion.g>
      <circle cx={40} cy={34} r={6} fill={SLATE} {...OUTLINE} />
    </AssetSvg>
  )
}
