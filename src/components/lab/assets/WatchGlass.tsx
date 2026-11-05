import { motion } from 'motion/react'

// Dari src/assets/lab/watch-glass.svg (viewBox 150 × 80).
const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

// Massa yang membuat tumpukan CuSO₄ tampil penuh (batas massa K2).
const FULL_MASS = 16

type Props = { mass?: number }

export default function WatchGlass({ mass = 0 }: Props) {
  // Tumpukan tampil sejak sendok pertama, lalu membesar sampai ukuran aslinya.
  const scale = 0.45 + 0.55 * Math.min(mass / FULL_MASS, 1)
  return (
    <svg
      viewBox="0 0 150 80"
      width="100%"
      height="100%"
      fill="none"
      className="block overflow-visible"
    >
      <path d="M10 30 Q75 82 140 30" fill="#D7EAF2" {...OUTLINE} />
      <ellipse cx={75} cy={30} rx={65} ry={16} fill="#EEF6FA" {...OUTLINE} />
      <ellipse cx={75} cy={31} rx={50} ry={10} fill="#FFFFFF" opacity={0.7} />
      <motion.path
        data-layer="contents"
        d="M52 34 Q75 14 98 34 Z"
        fill="#2F80ED"
        style={{ originX: 0.5, originY: 1 }}
        initial={false}
        animate={{ opacity: mass > 0 ? 1 : 0, scale: mass > 0 ? scale : 0.45 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      <path
        d="M28 44 Q50 60 74 63"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d="M30 26 Q44 20 60 19"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  )
}
