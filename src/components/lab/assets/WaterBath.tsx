import { motion } from 'motion/react'
import AssetSvg from './AssetSvg'
import {
  EASE,
  GLASS,
  LIQUID,
  METAL_DARK,
  ORANGE,
  OUTLINE,
  RED,
  SLATE,
  WHITE,
} from './svg-style'
import type { AssetProps } from './types'

const COIL = 'M36 96 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0'

export default function WaterBath({ view }: AssetProps) {
  const on = view.active === true
  return (
    <AssetSvg width={220} height={160}>
      <rect
        x="10"
        y="40"
        width="200"
        height="110"
        rx="12"
        fill="#B7C3D9"
        {...OUTLINE}
      />
      <rect
        x="26"
        y="30"
        width="168"
        height="76"
        rx="6"
        fill={GLASS}
        {...OUTLINE}
      />
      <rect
        x="29"
        y="56"
        width="162"
        height="47"
        rx="3"
        fill={view.color ?? LIQUID}
      />
      <rect x="29" y="56" width="162" height="5" fill="#A9DDEA" />
      <motion.path
        d={COIL}
        strokeWidth={3}
        initial={false}
        animate={{ stroke: on ? ORANGE : METAL_DARK }}
        transition={EASE}
      />
      <rect
        x="40"
        y="116"
        width="140"
        height="24"
        rx="6"
        fill={SLATE}
        {...OUTLINE}
      />
      <rect
        x="54"
        y="121"
        width="32"
        height="14"
        rx="7"
        fill={WHITE}
        {...OUTLINE}
      />
      <motion.circle
        cy="128"
        r="5"
        initial={false}
        animate={{ cx: on ? 78 : 62, fill: on ? RED : METAL_DARK }}
        transition={EASE}
      />
      <motion.circle
        cx="104"
        cy="128"
        r="5"
        {...OUTLINE}
        initial={false}
        animate={{ fill: on ? RED : '#5D6475' }}
        transition={EASE}
      />
      <text
        x="116"
        y="132"
        fontFamily="Inter, Arial"
        fontSize={11}
        fontWeight={600}
        fill={WHITE}
      >
        Pemanas
      </text>
    </AssetSvg>
  )
}

/**
 * The water again, see-through, drawn over whatever stands in the bath so
 * the lower part of it looks submerged.
 */
export function WaterBathFront({ view }: AssetProps) {
  return (
    <AssetSvg width={220} height={160}>
      <rect
        x="29"
        y="56"
        width="162"
        height="47"
        rx="3"
        fill={view.color ?? LIQUID}
        opacity={0.6}
      />
      <rect x="29" y="56" width="162" height="5" fill="#A9DDEA" opacity={0.9} />
    </AssetSvg>
  )
}
