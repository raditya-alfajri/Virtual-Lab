export const STAGE_WIDTH = 1440
export const STAGE_HEIGHT = 1024

import type { ItemView, World } from '../data/types'

export type Rect = { x: number; y: number; w: number; h: number }
export type Offset = { x: number; y: number }
export type Point = { x: number; y: number }

/** Where a label or an action button sits around its item. */
export type Side = 'below' | 'above' | 'left' | 'right'

/**
 * `x`/`y` put the item's home-sized box relative to its parent's top-left;
 * `rotate` then turns the box about its centre, in degrees clockwise.
 * The sides override where the label and the action button go while the
 * item rests on this parent.
 */
export type Attach = Offset & {
  rotate?: number
  labelSide?: Side
  actionSide?: Side
}

/**
 * Where an item is on the stage. When `rotate` is set, the rect is the box
 * around the turned drawing, which keeps its own size (`size`, or the home
 * size) at the rect's centre.
 */
export type Placement = Rect & {
  rotate?: number
  /** The turned drawing's own size, when a motion changed it. */
  size?: { w: number; h: number }
  labelSide?: Side
  actionSide?: Side
  /** Where the action button goes instead, in stage coordinates. */
  action?: Rect
}

export type MotionContext = {
  id: string
  /** Where the item is: a zone, another item, or the shelf. */
  at: string
  view: Record<string, ItemView>
  items: World['items']
  /** The final box of the item it rests on, before that item is turned. */
  parent?: Rect
}

/**
 * What a motion changes. `rect` is the drawing's box before turning;
 * `rotate` turns it about its centre, in degrees clockwise.
 */
export type Moved = {
  rect?: Rect
  rotate?: number
  labelSide?: Side
  actionSide?: Side
  /**
   * Where the action button goes, in stage coordinates, e.g. under a
   * swinging bob's resting point so the button holds still.
   */
  action?: Rect
}

/**
 * Moves an item with its state, e.g. a cart rolling or a spring stretching.
 * `base` is where the layout puts it otherwise, before turning.
 */
export type Motion = (base: Rect, ctx: MotionContext) => Moved

/**
 * An item that is pulled instead of dragged while `active`, e.g. a bob
 * pulled aside. `value` turns the pointer, in stage coordinates, into the
 * value for the experiment's `pull` rule.
 */
export type Pull = {
  active: (items: World['items']) => boolean
  value: (point: Point, items: World['items']) => number
}

export type SceneLayout = {
  /** Where the wall meets the floor in the background, in stage y; 800 when unset. */
  floorY?: number
  home: Record<string, Rect>
  zones: Record<string, Rect>
  /** Keyed by the attached item's id, then by the id of the item it rests on. */
  attach: Record<string, Record<string, Attach>>
  /** Keyed by zone id: a screen in the background that shows the reading of the item in that zone. */
  screens?: Record<string, Rect>
  /** Keyed by item id; labels sit below the item unless set here or in `attach`. */
  labelSide?: Record<string, Side>
  /** Keyed by item id; action buttons sit below the item unless set here or in `attach`. */
  actionSide?: Record<string, Side>
  /** Keyed by item id: where the item goes as its state changes. */
  motion?: Record<string, Motion>
  /** Keyed by item id: items pulled instead of dragged. */
  pull?: Record<string, Pull>
}
