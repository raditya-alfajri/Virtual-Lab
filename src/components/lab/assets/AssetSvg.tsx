import type { ReactNode } from 'react'

type Props = {
  width: number
  height: number
  children: ReactNode
}

/** Fills its box but keeps the drawing's proportions. */
export default function AssetSvg({ width, height, children }: Props) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      className="block size-full overflow-visible"
    >
      {children}
    </svg>
  )
}
