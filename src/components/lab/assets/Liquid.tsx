import { motion } from 'motion/react'

type Props = {
  clipId: string
  width: number
  // Batas atas (penuh) dan dasar (kosong) cairan dalam koordinat viewBox.
  top: number
  bottom: number
  level: number
  color: string
}

const transition = { duration: 0.4, ease: 'easeOut' } as const

// Layer `liquid` dari SVG aset: badan cairan + garis permukaan yang lebih terang.
// `y` di motion untuk SVG adalah translate, jadi rect digambar dari 0 lalu digeser.
export default function Liquid({
  clipId,
  width,
  top,
  bottom,
  level,
  color,
}: Props) {
  const y = bottom - Math.min(Math.max(level, 0), 1) * (bottom - top)
  return (
    <g data-layer="liquid" clipPath={`url(#${clipId})`}>
      <motion.rect
        x={0}
        width={width}
        height={bottom}
        initial={false}
        animate={{ y, fill: color }}
        transition={transition}
      />
      <motion.rect
        x={0}
        width={width}
        height={5}
        fill="#FFFFFF"
        opacity={0.4}
        initial={false}
        animate={{ y }}
        transition={transition}
      />
    </g>
  )
}
