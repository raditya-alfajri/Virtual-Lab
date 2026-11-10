import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'
import { StageScaleContext } from './stage-scale'

type Props = {
  background: string
  /** Laid over the stage without scaling, so text stays readable. */
  overlay?: ReactNode
  /** Shown right below the stage, as wide as the stage. */
  footer?: ReactNode
  onBackgroundClick?: () => void
  children?: ReactNode
}

/** The stage always spans the column's width; the page scrolls for height. */
export default function LabStage({
  background,
  overlay,
  footer,
  onBackgroundClick,
  children,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  const scale = width / STAGE_WIDTH

  return (
    <div>
      <div
        ref={cardRef}
        className="relative box-content overflow-hidden rounded-2xl border border-line bg-bg"
        style={{ height: STAGE_HEIGHT * scale }}
      >
        {scale > 0 && (
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
        )}
        <div className="pointer-events-none absolute inset-0 z-10">
          {overlay}
        </div>
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  )
}
