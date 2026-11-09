import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'
import { fitStage } from './fit-stage'
import { StageScaleContext } from './stage-scale'

const FOOTER_HEIGHT = 56
const FOOTER_GAP = 8

type Props = {
  background: string
  /** Laid over the stage without scaling, so text stays readable. */
  overlay?: ReactNode
  /** Shown right below the stage, as wide as the stage. */
  footer?: ReactNode
  onBackgroundClick?: () => void
  children?: ReactNode
}

export default function LabStage({
  background,
  overlay,
  footer,
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

  const { scale, left } = fitStage(
    size.width,
    size.height - FOOTER_HEIGHT - FOOTER_GAP,
  )

  return (
    <div ref={containerRef} className="absolute inset-3">
      {scale > 0 && (
        <div
          className="absolute top-0"
          style={{ left, width: STAGE_WIDTH * scale }}
        >
          <div
            className="relative overflow-hidden rounded-xl"
            style={{ height: STAGE_HEIGHT * scale }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
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
            <div className="pointer-events-none absolute inset-0 z-10">
              {overlay}
            </div>
          </div>
          <div style={{ height: FOOTER_HEIGHT, marginTop: FOOTER_GAP }}>
            {footer}
          </div>
        </div>
      )}
    </div>
  )
}
