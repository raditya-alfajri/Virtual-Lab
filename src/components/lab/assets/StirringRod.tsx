import { motion } from 'motion/react'

// Dari src/assets/lab/stirring-rod.svg (aslinya tegak, 24 × 180), digambar
// rebah: ujung kiri adalah ujung atas. Di gelas kimia, layout memutarnya.
type Props = { stirring?: boolean }

const STIR = { rotate: [0, -6, 6, 0] }
const REST = { rotate: 0 }

export default function StirringRod({ stirring = false }: Props) {
  return (
    <motion.svg
      viewBox="0 0 180 24"
      width="100%"
      height="100%"
      fill="none"
      className="block overflow-visible"
      // Animasi aduk diputar dari ujung atas batang.
      style={{ originX: 0, originY: 0.5 }}
      initial={false}
      animate={stirring ? STIR : REST}
      transition={
        stirring
          ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 }
      }
    >
      <rect
        x={6}
        y={7}
        width={168}
        height={10}
        rx={5}
        fill="#EEF6FA"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={18}
        y1={11}
        x2={160}
        y2={11}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
    </motion.svg>
  )
}
