import { motion } from 'motion/react'

// Dari src/assets/lab/cross-paper.svg (viewBox 150 × 96).
type Props = { visibility?: number }

export default function CrossPaper({ visibility = 1 }: Props) {
  return (
    <svg
      viewBox="0 0 150 96"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <rect
        x={6}
        y={6}
        width={138}
        height={84}
        rx={6}
        fill="#FFFFFF"
        stroke="#2B2D42"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <motion.g
        data-layer="cross"
        initial={false}
        animate={{ opacity: Math.min(Math.max(visibility, 0), 1) }}
        transition={{ duration: 0.3, ease: 'linear' }}
      >
        <line
          x1={50}
          y1={22}
          x2={100}
          y2={74}
          stroke="#2B2D42"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <line
          x1={100}
          y1={22}
          x2={50}
          y2={74}
          stroke="#2B2D42"
          strokeWidth={10}
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  )
}
