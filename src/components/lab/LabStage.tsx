import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH, type Rect } from '../../simulations/types'
import { fitCamera, visibleArea } from './camera'
import { StageFrameContext } from './stage-frame'
import { StageScaleContext } from './stage-scale'

// The wall and floor colours of the backgrounds, carried on past the stage's
// edges so the room fills the frame.
const WALL = '#F7FEFF'
const FLOOR = '#CBF3F7'
const DEFAULT_FLOOR_Y = 800
const DEFAULT_TOP_GAP = 16

type Props = {
  background: string
  /** Where the wall meets the floor in the background, in stage y. */
  floorY?: number
  /** Room kept above the stage, for what floats at the top of the frame. */
  topGap?: number
  /** Where the stage sits in a frame taller than it: 1 on the bottom edge, 0 at the top. */
  rest?: number
  /** The part of the stage to show enlarged, instead of the whole stage. */
  region?: Rect
  /** Width on the right kept free for the panels floating over the room. */
  reserve?: number
  /** Laid over the room without scaling, so text stays readable. */
  overlay?: ReactNode
  /** Floats at the bottom of the room, e.g. the shelf strip. */
  footer?: ReactNode
  /** Told the part of the stage on screen, in stage coordinates, whenever it changes. */
  onVisibleChange?: (area: Rect) => void
  onBackgroundClick?: () => void
  children?: ReactNode
}

/**
 * The stage as a room filling its frame: the stage is as large as fits left
 * of `reserve`, centred and resting on the bottom edge (or higher, see `rest`),
 * and the wall and floor go on around it. With a `region`, that part of the
 * stage fills the frame instead.
 */
export default function LabStage({
  background,
  floorY = DEFAULT_FLOOR_Y,
  topGap = DEFAULT_TOP_GAP,
  reserve = 0,
  rest = 1,
  region,
  overlay,
  footer,
  onVisibleChange,
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
  const camera = region
    ? fitCamera(
        region,
        { width: roomWidth, height: box.height },
        { width: STAGE_WIDTH, height: STAGE_HEIGHT },
      )
    : wholeStage(roomWidth, box.height, topGap, rest)
  const { scale, left, top } = camera
  const floor = top + floorY * scale

  useEffect(() => {
    if (scale <= 0) return
    onVisibleChange?.(
      visibleArea(
        { scale, left, top },
        { width: roomWidth, height: box.height },
      ),
    )
  }, [scale, left, top, roomWidth, box.height, onVisibleChange])

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
          className="absolute origin-top-left transition-[left,top,transform] duration-300 motion-reduce:transition-none"
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
        <StageFrameContext
          value={{ scale, left, top, width: roomWidth, height: box.height }}
        >
          {overlay}
        </StageFrameContext>
        {footer && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center px-4 sm:bottom-4">
            <div className="pointer-events-auto max-w-full min-w-0">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function wholeStage(
  width: number,
  height: number,
  topGap: number,
  rest: number,
) {
  const scale = Math.max(
    Math.min(width / STAGE_WIDTH, (height - topGap) / STAGE_HEIGHT),
    0,
  )
  const spare = height - STAGE_HEIGHT * scale
  return {
    scale,
    left: (width - STAGE_WIDTH * scale) / 2,
    top: Math.max(spare * rest, Math.min(topGap, spare)),
  }
}
