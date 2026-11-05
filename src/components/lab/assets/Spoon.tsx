import { motion } from 'motion/react'

// Dari src/assets/lab/spoon.svg (viewBox 160 × 50).
const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

type Props = { full?: boolean }

export default function Spoon({ full = false }: Props) {
  return (
    <svg
      viewBox="0 0 160 50"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <rect
        x={44}
        y={20}
        width={110}
        height={10}
        rx={5}
        fill="#B3BACB"
        {...OUTLINE}
      />
      <ellipse cx={26} cy={25} rx={20} ry={13} fill="#B3BACB" {...OUTLINE} />
      <ellipse cx={26} cy={25} rx={13} ry={7} fill="#7D859C" />
      <motion.ellipse
        data-layer="contents"
        cx={26}
        cy={23}
        rx={12}
        ry={6}
        fill="#2F80ED"
        initial={false}
        animate={{ opacity: full ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
    </svg>
  )
}
