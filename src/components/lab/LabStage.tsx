import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'
import { StageScaleContext } from './stage-scale'

type Props = {
  background: string
  /** Drawn over the stage without scaling, e.g. messages that must stay readable. */
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
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / STAGE_WIDTH)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    // z-10 keeps an item dragged past the bottom edge above what follows the stage.
    <div
      ref={containerRef}
      className="relative z-10 w-full"
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
        <StageScaleContext value={scale || 1}>{children}</StageScaleContext>
      </div>
      {overlay}
    </div>
  )
}
