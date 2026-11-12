import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../../simulations/types'
import { StageScaleContext } from '../stage-scale'
import type { Camera } from './camera'

type Props = {
  background: string
  camera: Camera
  viewportRef: (node: HTMLDivElement | null) => void
  /** Laid over the viewport without scaling, so text stays readable. */
  overlay?: ReactNode
  onBackgroundClick?: () => void
  children?: ReactNode
}

const CAMERA_MOVE = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.45,
} as const

/** The stage seen through a viewport; the camera glides between work areas. */
export default function MobileStage({
  background,
  camera,
  viewportRef,
  overlay,
  onBackgroundClick,
  children,
}: Props) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      ref={viewportRef}
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackgroundClick?.()
      }}
      className="relative size-full touch-manipulation overflow-hidden bg-bg"
    >
      {camera.scale > 0 && (
        <motion.div
          className="absolute top-0 left-0"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            originX: 0,
            originY: 0,
          }}
          initial={false}
          animate={{ x: camera.x, y: camera.y, scale: camera.scale }}
          transition={reduceMotion ? { duration: 0 } : CAMERA_MOVE}
        >
          <img
            src={background}
            alt=""
            draggable={false}
            onClick={onBackgroundClick}
            className="absolute inset-0 size-full select-none"
          />
          <StageScaleContext value={camera.scale}>{children}</StageScaleContext>
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 z-10">{overlay}</div>
    </div>
  )
}
