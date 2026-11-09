import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'
import { fitStage } from './fit-stage'
import { StageScaleContext } from './stage-scale'

type Props = {
  background: string
  /** Laid over the visible stage without scaling, so text stays readable. */
  overlay?: ReactNode
  onBackgroundClick?: () => void
  children?: ReactNode
}

export default function LabStage({
  background,
  overlay,
  onBackgroundClick,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const { scale, left, top } = fitStage(size.width, size.height)

  return (
    <div
      ref={containerRef}
      className="relative size-full overflow-hidden bg-wall"
    >
      {scale > 0 && (
        <>
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
          <div
            className="pointer-events-none absolute"
            style={{
              left,
              top,
              width: STAGE_WIDTH * scale,
              height: STAGE_HEIGHT * scale,
            }}
          >
            {overlay}
          </div>
        </>
      )}
    </div>
  )
}
