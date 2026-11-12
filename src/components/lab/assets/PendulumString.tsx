import { INK, WHITE } from './svg-style'

/**
 * F2 string: a ring on top and the string down to the bottom edge. Its
 * length follows the box (shorter on the board, to scale on the stand), so it
 * is drawn in box pixels without a viewBox.
 */
export default function PendulumString() {
  return (
    <svg
      width="100%"
      height="100%"
      fill="none"
      aria-hidden
      className="block overflow-visible"
    >
      {/* A touch area wider than the string itself. */}
      <line
        x1="50%"
        y1={0}
        x2="50%"
        y2="100%"
        stroke="transparent"
        strokeWidth={16}
      />
      <line
        x1="50%"
        y1={9}
        x2="50%"
        y2="100%"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle
        cx="50%"
        cy={5}
        r={4}
        fill={WHITE}
        stroke={INK}
        strokeWidth={2.5}
      />
    </svg>
  )
}
