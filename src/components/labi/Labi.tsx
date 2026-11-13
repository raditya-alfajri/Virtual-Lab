import clsx from 'clsx'
import { Mic, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LabiSession, LabiState } from '../../lib/labi/session'
import { speechLevel } from '../../lib/labi/speech-player'
import { STAGE_WIDTH, type Rect } from '../../simulations/types'
import { useStageFrame } from '../lab/stage-frame'
import AiBadge from './AiBadge'
import {
  cornerBox,
  pickCorner,
  placeBubble,
  snapToEdge,
  spotBox,
  type Room,
  type Spot,
} from './corner'
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
  /**
   * On a phone Labi waits small in a free corner, or where the student put it
   * along the edges, and folds its balloon away.
   */
  phone: boolean
  /** Room kept free at the top on a phone, for what floats there. */
  topClear?: number
  /** What Labi keeps clear of on a phone, in stage coordinates. */
  obstacles: Rect[]
  /** Opens the chat, to answer Labi's question in one's own words. */
  onAnswerYourself: () => void
}

/** The wall above the bench, in stage coordinates: where Labi drifts about. */
const ROAM = { x0: 150, x1: STAGE_WIDTH - 150, y0: 150, y1: 400 }
const HOME: Point = { x: 1130, y: 300 }
/** Labi's size on a stage drawn at full size, and its limits on screen. */
const STAGE_SIZE = 150
const MIN_SIZE = 52
const MAX_SIZE = 132
const WANDER_MS = [2500, 5500]
/** With a balloon open Labi only sways about its spot, so the text stays readable. */
const SWAY_MS = [2200, 3800]
const SWAY = { x: 90, y: 55 }
const BALLOON_Y = 230
/** Put somewhere by the student, Labi stays there and only bobs a little. */
const PLACED_SWAY = { x: 26, y: 16 }
/** A press that moves less than this is a click, not a drag. */
const DRAG_START = 6
/** The faces a click goes through, and how long each one stays. */
const POKE_FACES: Expression[] = [
  'happy',
  'wow',
  'proud',
  'curious',
  'confused',
]
const POKE_MS = 2600
/** How far the eyes move toward what Labi looks at, in drawing units. */
const GAZE = 4
/** With the pointer still this long, Labi looks at what it points out instead. */
const POINTER_REST_MS = 1500
/** Lean into a move, in degrees per pixel moved in a frame, and its limit. */
const LEAN_PER_PX = 1.6
const MAX_LEAN = 14
/** Labi's size on a phone, and what it keeps clear of along the room's edges. */
const PHONE_SIZE = 56
const PHONE_EDGES = { top: 8, side: 8, bottom: 60 }
/** On a phone a balloon folds into a dot after this long, unless it asks something. */
const FOLD_MS = 5000
/** The balloon's corner nearest Labi, drawn sharper as its tail. */
const TAIL: Record<string, string> = {
  tl: 'rounded-tl-sm',
  tr: 'rounded-tr-sm',
  bl: 'rounded-bl-sm',
  br: 'rounded-br-sm',
}

const between = (min: number, max: number) => min + Math.random() * (max - min)
/**
 * The part of a roaming range that is on screen; where none of it is, the
 * near end of what is on screen.
 */
function within(min: number, max: number, from: number, to: number) {
  const lo = Math.max(min, from)
  const hi = Math.min(max, to)
  return lo < hi ? [lo, hi] : [from, from + (to - from) * 0.35]
}
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function expressionOf(state: LabiState): Expression {
  if (state.status === 'thinking') return 'thinking'
  if (state.mic === 'listening') return 'listening'
  return state.mood
}

/** Labi hovering in the room: it drifts about, flies to what it talks about, and speaks in a balloon. */
export default function Labi({
  state,
  session,
  locate,
  passive,
  phone,
  topClear = PHONE_EDGES.top,
  obstacles,
  onAnswerYourself,
}: Props) {
  const frame = useStageFrame()
  const still = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState(HOME)
  // Where the student dragged Labi to; null while it roams on its own.
  const [placed, setPlaced] = useState<Point | null>(null)
  const [dragging, setDragging] = useState(false)
  const [poke, setPoke] = useState({ count: 0, on: false })
  const grab = useRef<{
    pointer: Point
    from: Point
    moved: boolean
    at?: Point
  } | null>(null)
  // On a phone: where the student put Labi, and where its box is while dragged.
  const [phoneSpot, setPhoneSpot] = useState<Spot | null>(null)
  const [phoneDrag, setPhoneDrag] = useState<Point | null>(null)
  const dragged = useRef(false)
  // Where on screen the pointed-out item is, for the eyes to turn to.
  const lookAt = useRef<Point | null>(null)
  // The balloon the student folded away, or that folded by itself, on a phone.
  const [foldedFor, setFoldedFor] = useState<string | null>(null)
  const [bubbleHeight, setBubbleHeight] = useState(0)
  const measureBubble = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) =>
      setBubbleHeight(entry.contentRect.height),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const size = phone
    ? PHONE_SIZE
    : clamp(STAGE_SIZE * frame.scale, MIN_SIZE, MAX_SIZE)
  const talking = state.status !== 'idle'
  const holding = state.bubble !== null
  const asking = state.choices.length > 0
  const folded = phone && state.bubble !== null && foldedFor === state.bubble
  const targetAt = state.target ? locate(state.target) : null
  // Labi flies to what it talks about; a step of the guide it only points out,
  // and it stays where the student put it. On a phone it stays in its corner.
  const flying = !phone && targetAt !== null && !state.guiding && !placed
  const pointing = flying
  const markerAt =
    state.guiding && targetAt
      ? {
          x: frame.left + targetAt.x * frame.scale,
          y: frame.top + targetAt.y * frame.scale,
        }
      : null
  // Nothing to point at while the item is outside the part of the room shown.
  const marker =
    markerAt &&
    markerAt.x >= 0 &&
    markerAt.x <= frame.width &&
    markerAt.y >= 0 &&
    markerAt.y <= frame.height
      ? markerAt
      : null
  // Labi keeps to the part of the wall that is on screen.
  const margin = frame.scale > 0 ? size / 2 / frame.scale : 0
  const [roamX0, roamX1] = within(
    ROAM.x0,
    ROAM.x1,
    -frame.left / (frame.scale || 1) + margin,
    (frame.width - frame.left) / (frame.scale || 1) - margin,
  )
  const [roamY0, roamY1] = within(
    ROAM.y0,
    ROAM.y1,
    (56 - frame.top) / (frame.scale || 1) + margin,
    (frame.height - 72 - frame.top) / (frame.scale || 1) - margin,
  )
  useEffect(() => {
    lookAt.current = marker
  })

  // Drift to a new spot on the wall now and then; stay put while speaking or
  // pointing at something, and only sway while a balloon is open or after the
  // student chose the spot.
  useEffect(() => {
    if (phone || talking || pointing || still || dragging) return
    const [min, max] = holding || placed ? SWAY_MS : WANDER_MS
    const timer = setTimeout(
      () =>
        setSpot((from) =>
          placed
            ? {
                x: placed.x + between(-PLACED_SWAY.x, PLACED_SWAY.x),
                y: placed.y + between(-PLACED_SWAY.y, PLACED_SWAY.y),
              }
            : holding
              ? {
                  x: clamp(from.x + between(-SWAY.x, SWAY.x), roamX0, roamX1),
                  y: clamp(from.y + between(-SWAY.y, SWAY.y), roamY0, roamY1),
                }
              : { x: between(roamX0, roamX1), y: between(roamY0, roamY1) },
        ),
      between(min, max),
    )
    return () => clearTimeout(timer)
  }, [
    phone,
    talking,
    pointing,
    holding,
    still,
    dragging,
    placed,
    spot,
    roamX0,
    roamX1,
    roamY0,
    roamY1,
  ])

  // On a phone the balloon folds into a dot after a while, unless it asks something.
  const bubble = state.bubble
  useEffect(() => {
    if (!phone || bubble === null || folded || asking) return
    const timer = setTimeout(() => setFoldedFor(bubble), FOLD_MS)
    return () => clearTimeout(timer)
  }, [phone, bubble, folded, asking])

  // The face a click chose goes back to Labi's own after a moment.
  useEffect(() => {
    if (!poke.on) return
    const timer = setTimeout(
      () => setPoke((last) => ({ ...last, on: false })),
      POKE_MS,
    )
    return () => clearTimeout(timer)
  }, [poke])

  // Beside the item it talks about, otherwise wherever it drifted or was put.
  const at =
    flying && targetAt && !dragging
      ? {
          x: clamp(
            targetAt.x + (targetAt.x > STAGE_WIDTH / 2 ? -150 : 150),
            90,
            STAGE_WIDTH - 90,
          ),
          y: Math.max(targetAt.y - 110, 100),
        }
      : // A balloon hangs below Labi: keep it up on the wall, off the bench.
        {
          x: spot.x,
          y:
            holding && !placed
              ? Math.min(spot.y, Math.max(BALLOON_Y, roamY0))
              : spot.y,
        }
  // On a phone: where the student put Labi, else the corner that leaves the
  // most of the bench in view.
  const room: Room = {
    width: frame.width,
    height: frame.height,
    ...PHONE_EDGES,
    top: topClear,
  }
  const box = { w: size, h: size * 1.1 }
  const onScreen = phone
    ? obstacles.map((rect) => ({
        x: frame.left + rect.x * frame.scale,
        y: frame.top + rect.y * frame.scale,
        w: rect.w * frame.scale,
        h: rect.h * frame.scale,
      }))
    : []
  const labiBox: Rect | null = !phone
    ? null
    : phoneDrag
      ? { ...phoneDrag, ...box }
      : phoneSpot
        ? spotBox(phoneSpot, room, box)
        : cornerBox(pickCorner(room, box, onScreen), room, box)
  const x = labiBox
    ? labiBox.x + size / 2
    : clamp(
        frame.left + at.x * frame.scale,
        size / 2 + 8,
        Math.max(frame.width - size / 2 - 8, size / 2 + 8),
      )
  const y = labiBox
    ? labiBox.y + size / 2
    : clamp(
        frame.top + at.y * frame.scale,
        size / 2 + 56,
        Math.max(frame.height - size / 2 - 72, size / 2 + 56),
      )

  // Eyes follow the pointer and the glow follows the voice, without re-rendering.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let pointer: Point | null = null
    let pointerAt = -Infinity
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      pointerAt = performance.now()
    }
    window.addEventListener('pointermove', onMove)
    let frameId = 0
    let level = 0
    let lastX: number | null = null
    const now = { turnX: 0, turnY: 0, lean: 0 }
    const written: Record<string, string> = {}
    // Styles are only touched when a value changes, so a resting Labi costs nothing.
    const write = (name: string, value: string) => {
      if (written[name] === value) return
      written[name] = value
      root.style.setProperty(name, value)
    }
    const loop = () => {
      const target = speechLevel()
      level += (target - level) * (target > level ? 0.6 : 0.25)
      write('--labi-level', level.toFixed(2))

      const box = root.getBoundingClientRect()
      const centre = {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      }
      const speed = lastX === null ? 0 : centre.x - lastX
      lastX = centre.x

      const resting = performance.now() - pointerAt > POINTER_REST_MS
      const look = resting ? (lookAt.current ?? pointer) : pointer
      let turnX = 0
      let turnY = 0
      if (look) {
        const dx = look.x - centre.x
        const dy = look.y - centre.y
        const reach = Math.hypot(dx, dy) || 1
        const pull = Math.min(reach / 160, 1)
        turnX = (dx / reach) * pull
        turnY = (dy / reach) * pull
      }
      // The head turns the way it flies, and leans into the move.
      turnX = clamp(turnX + speed * 0.12, -1, 1)
      now.turnX += (turnX - now.turnX) * 0.18
      now.turnY += (turnY - now.turnY) * 0.18
      now.lean +=
        (clamp(speed * LEAN_PER_PX, -MAX_LEAN, MAX_LEAN) - now.lean) * 0.2
      write('--labi-turn-x', now.turnX.toFixed(2))
      write('--labi-turn-y', now.turnY.toFixed(2))
      write('--labi-lean', `${now.lean.toFixed(1)}deg`)
      write('--labi-gaze-x', `${(now.turnX * GAZE).toFixed(1)}px`)
      write('--labi-gaze-y', `${(now.turnY * GAZE * 0.7).toFixed(1)}px`)
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  if (frame.scale <= 0) return null

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragged.current = false
    grab.current = {
      pointer: { x: event.clientX, y: event.clientY },
      from: { x, y },
      moved: false,
    }
  }
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const held = grab.current
    if (!held) return
    const dx = event.clientX - held.pointer.x
    const dy = event.clientY - held.pointer.y
    if (!held.moved && Math.hypot(dx, dy) < DRAG_START) return
    held.moved = true
    dragged.current = true
    const next = {
      x: (held.from.x + dx - frame.left) / frame.scale,
      y: (held.from.y + dy - frame.top) / frame.scale,
    }
    setDragging(true)
    setSpot(next)
    setPlaced(next)
  }
  const onPointerEnd = () => {
    grab.current = null
    setDragging(false)
  }
  const onPhoneDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !labiBox) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragged.current = false
    grab.current = {
      pointer: { x: event.clientX, y: event.clientY },
      from: { x: labiBox.x, y: labiBox.y },
      moved: false,
    }
    // Pressed, Labi shows another face, as a click does on a laptop.
    setPoke((last) => ({ count: last.count + 1, on: true }))
  }
  const onPhoneMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const held = grab.current
    if (!held) return
    event.stopPropagation()
    const dx = event.clientX - held.pointer.x
    const dy = event.clientY - held.pointer.y
    if (!held.moved && Math.hypot(dx, dy) < DRAG_START) return
    held.moved = true
    dragged.current = true
    held.at = {
      x: clamp(held.from.x + dx, 0, Math.max(frame.width - box.w, 0)),
      y: clamp(held.from.y + dy, 0, Math.max(frame.height - box.h, 0)),
    }
    setDragging(true)
    setPhoneDrag(held.at)
  }
  // Let go, Labi settles on the nearest free edge or corner.
  const onPhoneEnd = () => {
    const held = grab.current
    grab.current = null
    if (held?.moved && held.at) {
      setPhoneSpot(snapToEdge(held.at, room, box, onScreen))
    }
    setPhoneDrag(null)
    setDragging(false)
  }
  const pokeLabi = () => {
    setPoke((last) => ({ count: last.count + 1, on: true }))
    // A poke also asks: what do I do now?
    session.nudge()
  }
  const onClick = () => {
    // The click that ends a drag is not a poke.
    if (dragged.current) {
      dragged.current = false
      return
    }
    pokeLabi()
  }
  // On a phone a tap opens a folded balloon, folds an open one, or else asks
  // for the next step; the end of a drag is not a tap.
  const onTap = () => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    if (state.bubble === null) session.nudge()
    else setFoldedFor(folded ? null : state.bubble)
  }
  // A click always shows a face other than the one Labi already has.
  const own = expressionOf(state)
  const faces = POKE_FACES.filter((face) => face !== own)
  const expression =
    poke.on && state.status === 'idle'
      ? faces[(poke.count - 1) % faces.length]
      : own

  const bubbleLeft = x > frame.width / 2
  const bubbleWidth = phone
    ? Math.max(
        Math.min(frame.width * 0.7, frame.width - size - PHONE_EDGES.side * 3),
        120,
      )
    : clamp((bubbleLeft ? x : frame.width - x) - size / 2 - 20, 120, 260)
  // On a phone the balloon goes around Labi wherever it hides the least, inside the room.
  const bubbleAt =
    labiBox &&
    placeBubble(labiBox, { w: bubbleWidth, h: bubbleHeight }, room, onScreen)
  const towardLabi = bubbleAt && { x: x - bubbleAt.x, y: y - bubbleAt.y }
  const tail =
    bubbleAt && towardLabi
      ? TAIL[
          `${towardLabi.y < bubbleAt.h / 2 ? 't' : 'b'}${towardLabi.x < bubbleAt.w / 2 ? 'l' : 'r'}`
        ]
      : bubbleLeft
        ? 'rounded-tr-sm'
        : 'rounded-tl-sm'
  const listening = state.mic === 'listening'
  const caption =
    state.mic === 'opening'
      ? 'Menyalakan mikrofon…'
      : listening
        ? state.partial || 'Mendengarkan…'
        : null

  return (
    <>
      <AnimatePresence>
        {marker && !dragging && (
          <motion.div
            key={state.target}
            aria-hidden
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute top-0 left-0 z-[1400]"
            style={{ x: marker.x - 14, y: Math.max(marker.y - 34, 4) }}
          >
            <svg
              viewBox="0 0 28 30"
              className="labi-point block h-[30px] w-7 drop-shadow"
            >
              <path
                d="M4 4H24L14 26Z"
                fill="#5EEBFF"
                stroke="#2B2D42"
                strokeWidth={3}
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
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
            : dragging
              ? { type: 'spring', stiffness: 700, damping: 45, mass: 0.5 }
              : { type: 'spring', stiffness: 38, damping: 11, mass: 1.1 }
        }
      >
        <button
          type="button"
          {...(phone
            ? {
                onClick: onTap,
                onPointerDown: onPhoneDown,
                onPointerMove: onPhoneMove,
                onPointerUp: onPhoneEnd,
                onPointerCancel: onPhoneEnd,
                onContextMenu: (event: React.MouseEvent) =>
                  event.preventDefault(),
                'aria-label': folded
                  ? 'Labi punya pesan. Ketuk untuk membacanya, tahan lalu geser untuk memindahkannya.'
                  : holding
                    ? 'Labi. Ketuk untuk melipat pesannya, tahan lalu geser untuk memindahkannya.'
                    : 'Labi. Ketuk untuk petunjuk langkah, tahan lalu geser untuk memindahkannya.',
              }
            : {
                onClick,
                onPointerDown,
                onPointerMove,
                onPointerUp: onPointerEnd,
                onPointerCancel: onPointerEnd,
                'aria-label':
                  'Labi. Klik untuk petunjuk langkah, tahan lalu geser untuk memindahkannya.',
                title:
                  'Klik aku untuk petunjuk, atau tahan lalu geser untuk memindahkanku',
              })}
          className={clsx(
            'labi-float group relative block size-full rounded-full select-none',
            'outline-offset-4 transition-transform',
            phone
              ? clsx(
                  'touch-none [-webkit-touch-callout:none]',
                  dragging
                    ? 'scale-110 cursor-grabbing'
                    : 'cursor-grab active:scale-95',
                )
              : dragging
                ? 'scale-110 cursor-grabbing touch-none'
                : 'cursor-grab touch-none hover:scale-105 active:scale-95',
            passive ? 'pointer-events-none' : 'pointer-events-auto',
          )}
        >
          <LabiFace
            expression={expression}
            speaking={state.status === 'speaking'}
            className="size-full overflow-visible drop-shadow-md"
          />
          {listening && (
            <span className="absolute -right-1 bottom-1 flex size-6 items-center justify-center rounded-full bg-rose-500 text-white shadow ring-2 ring-white">
              <Mic size={13} />
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/60" />
            </span>
          )}
          {folded && (
            <span
              aria-hidden
              className="absolute top-0 right-0 size-3.5 rounded-full bg-rose-500 ring-2 ring-white"
            />
          )}
        </button>

        <AnimatePresence>
          {((state.bubble && !folded) || caption) && (
            <motion.div
              key="bubble"
              ref={measureBubble}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.16 }}
              className={clsx(
                'absolute flex flex-col gap-1.5',
                bubbleAt && labiBox && towardLabi
                  ? clsx(
                      // On a phone only the buttons catch a tap; the bench below stays reachable.
                      'pointer-events-none',
                      towardLabi.x > bubbleAt.w / 2
                        ? 'items-end'
                        : 'items-start',
                    )
                  : clsx(
                      'top-1',
                      bubbleLeft
                        ? 'right-full mr-2 items-end'
                        : 'left-full ml-2 items-start',
                    ),
              )}
              style={
                bubbleAt && labiBox && towardLabi
                  ? {
                      left: bubbleAt.x - labiBox.x,
                      top: bubbleAt.y - labiBox.y,
                      width: bubbleWidth,
                      transformOrigin: `${towardLabi.x}px ${towardLabi.y}px`,
                    }
                  : {
                      width: bubbleWidth,
                      transformOrigin: bubbleLeft ? 'right 30%' : 'left 30%',
                    }
              }
            >
              {state.bubble && !folded && (
                <div
                  aria-live="polite"
                  className={clsx(
                    'max-w-full rounded-2xl border-2 border-ink bg-white leading-snug font-medium text-ink shadow-[0_3px_0_0_var(--color-ink)]',
                    phone
                      ? 'px-2.5 py-1.5 text-xs'
                      : 'relative py-2.5 pr-8 pl-3.5 text-sm',
                    tail,
                    !phone &&
                      (passive ? 'pointer-events-none' : 'pointer-events-auto'),
                  )}
                >
                  <p
                    className={
                      asking
                        ? undefined
                        : phone
                          ? 'line-clamp-3'
                          : 'line-clamp-5'
                    }
                  >
                    {state.bubbleByAi && <AiBadge />}
                    {state.bubble}
                  </p>
                  {!phone && (
                    <button
                      type="button"
                      onClick={() => session.dismissBubble()}
                      aria-label="Tutup balon Labi"
                      className="absolute top-1.5 right-1.5 rounded-md p-1 text-ink-muted hover:bg-primary-tint hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <LabiChoices
                    choices={state.choices}
                    onChoose={(choice) => session.choose(choice)}
                    onAnswerYourself={onAnswerYourself}
                    passive={passive}
                  />
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
    </>
  )
}
