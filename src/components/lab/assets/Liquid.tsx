import { motion } from 'motion/react'
import { useId } from 'react'
import { levelToY, svgId } from './asset-math'
import { EASE, LIQUID, WHITE } from './svg-style'

type Props = {
  /** The inside of the container; the liquid never leaves it. */
  shape: string
  width: number
  height: number
  bottom: number
  top: number
  level: unknown
  color?: string
}

export default function Liquid({
  shape,
  width,
  height,
  bottom,
  top,
  level,
  color = LIQUID,
}: Props) {
  const clipId = svgId(useId())
  const y = levelToY(level, bottom, top)
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={shape} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x={0}
          width={width}
          height={height}
          initial={false}
          animate={{ attrY: y, fill: color }}
          transition={EASE}
        />
        <motion.rect
          x={0}
          width={width}
          height={5}
          fill={WHITE}
          opacity={0.4}
          initial={false}
          animate={{ attrY: y }}
          transition={EASE}
        />
      </g>
    </>
  )
}
