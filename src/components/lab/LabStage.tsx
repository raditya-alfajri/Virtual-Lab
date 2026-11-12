import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'
import { StageScaleContext } from './stage-scale'

// The wall and floor colours of the backgrounds, carried on past the stage's
// edges so the room fills the frame.
const WALL = '#F7FEFF'
const FLOOR = '#CBF3F7'
const DEFAULT_FLOOR_Y = 800
/** Room kept above the stage, so the hint does not cover its top. */
const TOP_GAP = 16

type Props = {
  background: string
  /** Where the wall meets the floor in the background, in stage y. */
  floorY?: number
  /** Width on the right kept free for the panels floating over the room. */
  reserve?: number
  /** Laid over the room without scaling, so text stays readable. */
  overlay?: ReactNode
  /** Floats at the bottom of the room, e.g. the shelf strip. */
  footer?: ReactNode
  onBackgroundClick?: () => void
  children?: ReactNode
}

/**
 * The stage as a room filling its frame: the stage is as large as fits left
 * of `reserve`, centred and resting on the bottom edge, and the wall and floor
 * go on around it.
 */
export default function LabStage({
  background,
  floorY = DEFAULT_FLOOR_Y,
  reserve = 0,
  overlay,
  footer,
  onBackgroundClick,
  children,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => {
      setBox({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const roomWidth = Math.max(box.width - reserve, 0)
  const scale = Math.max(
    Math.min(roomWidth / STAGE_WIDTH, (box.height - TOP_GAP) / STAGE_HEIGHT),
    0,
  )
  const left = (roomWidth - STAGE_WIDTH * scale) / 2
  const top = box.height - STAGE_HEIGHT * scale
  const floor = top + floorY * scale

  return (
    <div
      ref={frameRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackgroundClick?.()
      }}
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${WALL} ${floor}px, ${FLOOR} ${floor}px)`,
      }}
    >
      {scale > 0 && (
        <div
          className="absolute origin-top-left"
          style={{
            left,
            top,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <img
            src={background}
            alt=""
            draggable={false}
            onClick={onBackgroundClick}
            className="absolute inset-0 size-full select-none"
          />
          <StageScaleContext value={scale}>{children}</StageScaleContext>
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10"
        style={{ right: reserve }}
      >
        {overlay}
        {footer && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="pointer-events-auto max-w-full min-w-0">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
