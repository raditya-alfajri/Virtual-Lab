import { motion } from 'motion/react'

// Dari src/assets/lab/water-bath.svg (viewBox 220 × 160).
const OUTLINE = {
  stroke: '#2B2D42',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

// Warna saat menyala, dari palet aset (oranye pemanas, merah lampu).
const COIL_ON = '#F4A340'
const COIL_OFF = '#7D859C'
const LIGHT_ON = '#E3604F'
const LIGHT_OFF = '#5D6475'

const transition = { duration: 0.3, ease: 'easeOut' } as const

type Props = { on?: boolean; color?: string }

export default function WaterBath({ on = false, color = '#7CC6D9' }: Props) {
  return (
    <svg
      viewBox="0 0 220 160"
      width="100%"
      height="100%"
      fill="none"
      className="block"
    >
      <rect
        x={10}
        y={40}
        width={200}
        height={110}
        rx={12}
        fill="#B7C3D9"
        {...OUTLINE}
      />
      <rect
        x={26}
        y={30}
        width={168}
        height={76}
        rx={6}
        fill="#EEF6FA"
        {...OUTLINE}
      />
      <g data-layer="liquid">
        <rect x={29} y={56} width={162} height={47} rx={3} fill={color} />
        <rect x={29} y={56} width={162} height={5} fill="#A9DDEA" />
      </g>
      <motion.path
        data-layer="coil"
        d="M36 96 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"
        strokeWidth={3}
        initial={false}
        animate={{ stroke: on ? COIL_ON : COIL_OFF }}
        transition={transition}
      />
      <rect
        x={40}
        y={116}
        width={140}
        height={24}
        rx={6}
        fill="#4B5468"
        {...OUTLINE}
      />
      <rect
        data-layer="switch"
        x={54}
        y={121}
        width={32}
        height={14}
        rx={7}
        fill="#FFFFFF"
        {...OUTLINE}
      />
      <motion.circle
        data-layer="switch-knob"
        cy={128}
        r={5}
        initial={false}
        animate={{ cx: on ? 78 : 62, fill: on ? LIGHT_ON : COIL_OFF }}
        transition={transition}
      />
      <motion.circle
        data-layer="heater-light"
        cx={104}
        cy={128}
        r={5}
        {...OUTLINE}
        initial={false}
        animate={{ fill: on ? LIGHT_ON : LIGHT_OFF }}
        transition={transition}
      />
      <text
        x={116}
        y={132}
        fontSize={11}
        fontWeight={600}
        fill="#FFFFFF"
        className="font-sans"
      >
        Pemanas
      </text>
    </svg>
  )
}
