import type { Rect } from '../../simulations/types'
import { INK } from './assets/svg-style'

const SCREEN = '#1F2433'
const DIGITS = '#5BE37D'

type Props = {
  rect: Rect
  text: string
  label: string
}

/** A reading drawn onto a screen that is part of the background. */
export default function StageScreen({ rect, text, label }: Props) {
  return (
    <output
      aria-label={label}
      className="pointer-events-none absolute flex items-center justify-center rounded-[7.5px] font-mono text-[22px] font-semibold tabular-nums"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundColor: SCREEN,
        border: `2.25px solid ${INK}`,
        color: DIGITS,
        textShadow: `0 0 6px ${DIGITS}66`,
      }}
    >
      {text}
    </output>
  )
}
