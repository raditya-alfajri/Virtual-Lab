import clsx from 'clsx'
import { Mic } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { LabiSession, LabiState } from '../../lib/labi/session'
import { speechLevel } from '../../lib/labi/speech-player'
import { STAGE_WIDTH } from '../../simulations/types'
import { useStageFrame } from '../lab/stage-frame'
import LabiChoices from './LabiChoices'
import LabiFace, { type Expression } from './LabiFace'

type Point = { x: number; y: number }

type Props = {
  state: LabiState
  session: LabiSession
  /** Where an item is, in stage coordinates: the middle of its top edge. */
  locate: (itemId: string) => Point | null
  /** True while something is dragged: Labi must not catch the pointer. */
  passive: boolean
}

/** The wall above the bench, in stage coordinates: where Labi drifts about. */
const ROAM = { x0: 150, x1: STAGE_WIDTH - 150, y0: 150, y1: 400 }
const HOME: Point = { x: 1130, y: 300 }
/** Labi's size on a stage drawn at full size, and its limits on screen. */
const STAGE_SIZE = 150
const MIN_SIZE = 52
const MAX_SIZE = 132
const WANDER_MS = [3500, 7000]
/** How far the eyes move toward what Labi looks at, in drawing units. */
const GAZE = 4
const COMPACT_BELOW = 640

const between = (min: number, max: number) => min + Math.random() * (max - min)
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function expressionOf(state: LabiState): Expression {
  if (state.status === 'thinking') return 'thinking'
  if (state.status === 'idle' && state.mic === 'on' && state.partial) {
    return 'listening'
  }
  return state.mood
}

/** Labi hovering in the room: it drifts about, flies to what it talks about, and speaks in a balloon. */
export default function Labi({ state, session, locate, passive }: Props) {
  const frame = useStageFrame()
  const still = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState(HOME)

  const size = clamp(STAGE_SIZE * frame.scale, MIN_SIZE, MAX_SIZE)
  const busy = state.status !== 'idle' || state.bubble !== null
  const targetAt = state.target ? locate(state.target) : null

  // Drift to a new spot on the wall now and then, but stay put while talking.
  useEffect(() => {
    if (busy || still) return
    const timer = setTimeout(
      () =>
        setSpot({
          x: between(ROAM.x0, ROAM.x1),
          y: between(ROAM.y0, ROAM.y1),
        }),
      between(WANDER_MS[0], WANDER_MS[1]),
    )
    return () => clearTimeout(timer)
  }, [busy, still, spot])

  // Beside the item it talks about, otherwise wherever it drifted to.
  const at = targetAt
    ? {
        x: clamp(
          targetAt.x + (targetAt.x > STAGE_WIDTH / 2 ? -150 : 150),
          90,
          STAGE_WIDTH - 90,
        ),
        y: Math.max(targetAt.y - 110, 100),
      }
    : spot
  const x = clamp(
    frame.left + at.x * frame.scale,
    size / 2 + 8,
    Math.max(frame.width - size / 2 - 8, size / 2 + 8),
  )
  const y = clamp(
    frame.top + at.y * frame.scale,
    size / 2 + 56,
    Math.max(frame.height - size / 2 - 72, size / 2 + 56),
  )

  // Eyes follow the pointer and the glow follows the voice, without re-rendering.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let pointer: Point | null = null
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('pointermove', onMove)
    let frameId = 0
    let level = 0
    const loop = () => {
      const target = speechLevel()
      level += (target - level) * (target > level ? 0.6 : 0.25)
      root.style.setProperty('--labi-level', level.toFixed(3))
      if (pointer) {
        const box = root.getBoundingClientRect()
        const dx = pointer.x - (box.left + box.width / 2)
        const dy = pointer.y - (box.top + box.height / 2)
        const reach = Math.hypot(dx, dy) || 1
        const pull = Math.min(reach / 160, 1) * GAZE
        root.style.setProperty(
          '--labi-gaze-x',
          `${((dx / reach) * pull).toFixed(2)}px`,
        )
        root.style.setProperty(
          '--labi-gaze-y',
          `${((dy / reach) * pull * 0.7).toFixed(2)}px`,
        )
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  if (frame.scale <= 0) return null

  const bubbleLeft = x > frame.width / 2
  const bubbleWidth = clamp(
    (bubbleLeft ? x : frame.width - x) - size / 2 - 20,
    120,
    300,
  )
  // A small room (a phone): the balloon stays short, the chat below has the rest.
  const compact = frame.width < COMPACT_BELOW
  const listening = state.mic === 'on'
  const caption =
    state.mic === 'opening'
      ? 'Menyalakan mikrofon…'
      : listening && state.partial
        ? state.partial
        : null

  return (
    <motion.div
      ref={rootRef}
      className="labi absolute top-0 left-0 z-[1500]"
      style={{
        width: size,
        height: size * 1.1,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={false}
      animate={{ x, y }}
      transition={
        still
          ? { duration: 0 }
          : { type: 'spring', stiffness: 38, damping: 11, mass: 1.1 }
      }
    >
      <button
        type="button"
        onClick={() => session.toggleMic()}
        aria-label={
          listening ? 'Matikan mikrofon' : 'Bicara dengan Labi lewat mikrofon'
        }
        aria-pressed={listening}
        title={
          listening ? 'Klik untuk mematikan mikrofon' : 'Klik untuk bicara'
        }
        className={clsx(
          'labi-float group relative block size-full cursor-pointer rounded-full outline-offset-4 transition-transform hover:scale-105 active:scale-95',
          passive ? 'pointer-events-none' : 'pointer-events-auto',
        )}
      >
        <LabiFace
          expression={expressionOf(state)}
          speaking={state.status === 'speaking'}
          className="size-full overflow-visible drop-shadow-md"
        />
        {listening && (
          <span className="absolute -right-1 bottom-1 flex size-6 items-center justify-center rounded-full bg-rose-500 text-white shadow ring-2 ring-white">
            <Mic size={13} />
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/60" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {(state.bubble || caption) && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.16 }}
            className={clsx(
              'absolute top-1 flex flex-col gap-1.5',
              bubbleLeft
                ? 'right-full mr-2 items-end'
                : 'left-full ml-2 items-start',
            )}
            style={{
              width: bubbleWidth,
              transformOrigin: bubbleLeft ? 'right 30%' : 'left 30%',
            }}
          >
            {state.bubble && (
              <div
                aria-live="polite"
                className={clsx(
                  'max-w-full rounded-2xl border-2 border-ink bg-white leading-snug font-medium text-ink shadow-[0_3px_0_0_var(--color-ink)]',
                  compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 text-sm',
                  bubbleLeft ? 'rounded-tr-sm' : 'rounded-tl-sm',
                  passive ? 'pointer-events-none' : 'pointer-events-auto',
                )}
              >
                {compact ? (
                  // No room to spare: a tap puts the balloon away, the chat keeps the words.
                  <button
                    type="button"
                    onClick={() => session.dismissBubble()}
                    aria-label="Tutup balon Labi"
                    className="line-clamp-4 text-left"
                  >
                    {state.bubble}
                  </button>
                ) : (
                  <p>{state.bubble}</p>
                )}
                {!compact && (
                  <LabiChoices
                    choices={state.choices}
                    onChoose={(choice) => session.choose(choice)}
                  />
                )}
              </div>
            )}
            {caption && (
              <p className="max-w-full rounded-full bg-ink/85 px-3 py-1 text-xs text-white italic">
                {caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
