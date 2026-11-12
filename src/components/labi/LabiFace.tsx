import type { ReactNode } from 'react'
import type { Mood } from '../../../api/_lib/protocol'

export type Expression = Mood | 'thinking' | 'listening'

const INK = '#2B2D42'
const GLOW = '#5EEBFF'
const LEFT_EYE = 44
const RIGHT_EYE = 76
const EYE_Y = 64

const line = {
  fill: 'none',
  stroke: GLOW,
  strokeWidth: 5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function Spinner() {
  return (
    <g className="labi-spin">
      <circle r={7.5} {...line} strokeWidth={4} opacity={0.25} />
      <path d="M0 -7.5A7.5 7.5 0 0 1 7.5 0" {...line} strokeWidth={4} />
    </g>
  )
}

/** One eye per expression, drawn around (0, 0); `side` is -1 left, 1 right. */
const EYES: Record<Expression, (side: -1 | 1) => ReactNode> = {
  neutral: () => (
    <rect x={-6} y={-9} width={12} height={18} rx={6} fill={GLOW} />
  ),
  happy: () => <path d="M-8 4Q0 -9 8 4" {...line} />,
  proud: () => <path d="M-9 4A9 9 0 0 1 9 4Z" fill={GLOW} />,
  wow: () => (
    <>
      <circle r={8} {...line} strokeWidth={4} />
      <circle r={2.5} fill={GLOW} />
    </>
  ),
  curious: (side) =>
    side < 0 ? (
      <rect x={-5} y={-5} width={10} height={10} rx={5} fill={GLOW} />
    ) : (
      <rect x={-7} y={-11} width={14} height={22} rx={7} fill={GLOW} />
    ),
  confused: (side) => (
    <path d={side < 0 ? 'M-6 -7L6 0L-6 7' : 'M6 -7L-6 0L6 7'} {...line} />
  ),
  sad: (side) => (
    <g transform={`rotate(${side * 16})`}>
      <path d="M-8 -3H8A8 8 0 0 1 -8 -3Z" fill={GLOW} />
    </g>
  ),
  thinking: () => <Spinner />,
  listening: () => <circle r={8} fill={GLOW} className="labi-listen" />,
}

/** Labi's head tilts a little with some feelings. */
const TILT: Partial<Record<Expression, number>> = {
  curious: -8,
  confused: 7,
  sad: 4,
  proud: -3,
}

type Props = {
  expression: Expression
  speaking: boolean
  className?: string
}

/**
 * Labi: a small hovering robot with a dark visor and glowing eyes. The eyes
 * follow `--labi-gaze-x/y` and the mouth and glow follow `--labi-level`, which
 * the owner sets on an ancestor without re-rendering.
 */
export default function LabiFace({ expression, speaking, className }: Props) {
  const eye = EYES[expression]
  return (
    <svg
      viewBox="0 0 120 132"
      className={className}
      role="img"
      aria-label="Labi, asisten lab"
    >
      <defs>
        <linearGradient id="labi-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#C7CEE0" />
        </linearGradient>
        <radialGradient id="labi-jet" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor={GLOW} stopOpacity="0.9" />
          <stop offset="1" stopColor={GLOW} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={60} cy={127} rx={26} ry={4} fill="#000" opacity={0.12} />
      <path
        d="M44 104H76L68 122H52Z"
        fill="url(#labi-jet)"
        className="labi-jet"
      />

      <g
        className="labi-head"
        style={{ transform: `rotate(${TILT[expression] ?? 0}deg)` }}
      >
        {/* Antenna */}
        <path
          d="M60 22V10"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle
          cx={60}
          cy={8}
          r={5.5}
          fill={GLOW}
          stroke={INK}
          strokeWidth={2.5}
          className="labi-antenna"
        />

        {/* Ears */}
        <rect
          x={5}
          y={54}
          width={12}
          height={24}
          rx={5}
          fill="#8D96B3"
          stroke={INK}
          strokeWidth={2.5}
        />
        <rect
          x={103}
          y={54}
          width={12}
          height={24}
          rx={5}
          fill="#8D96B3"
          stroke={INK}
          strokeWidth={2.5}
        />

        {/* Shell */}
        <path
          d="M14 70C14 39 34 20 60 20C86 20 106 39 106 70V84C106 96 96 105 84 105H36C24 105 14 96 14 84Z"
          fill="url(#labi-shell)"
          stroke={INK}
          strokeWidth={3}
        />
        <path
          d="M27 46C32 35 41 29 52 27"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.9}
        />
        <circle cx={25} cy={93} r={5} fill="#FF9DB5" opacity={0.75} />
        <circle cx={95} cy={93} r={5} fill="#FF9DB5" opacity={0.75} />

        {/* Visor */}
        <rect
          x={23}
          y={42}
          width={74}
          height={46}
          rx={21}
          fill="#161A2B"
          stroke={INK}
          strokeWidth={3}
        />
        <path
          d="M34 50C40 46 48 45 56 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.25}
        />

        <g className="labi-glow">
          <g className="labi-gaze">
            <g key={expression} className="labi-eyes">
              <g transform={`translate(${LEFT_EYE} ${EYE_Y})`}>{eye(-1)}</g>
              <g transform={`translate(${RIGHT_EYE} ${EYE_Y})`}>{eye(1)}</g>
            </g>
            {speaking && (
              <rect
                x={54}
                y={78.5}
                width={12}
                height={3}
                rx={1.5}
                fill={GLOW}
                className="labi-mouth"
              />
            )}
          </g>
          {expression === 'sad' && (
            <path
              d="M86 74C86 74 82 80 86 82C90 80 86 74 86 74Z"
              fill="#9BE7FF"
              className="labi-tear"
            />
          )}
        </g>
      </g>
    </svg>
  )
}
