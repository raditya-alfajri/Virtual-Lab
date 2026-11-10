export const STAGE_WIDTH = 1440
export const STAGE_HEIGHT = 1024

export type Rect = { x: number; y: number; w: number; h: number }
export type Offset = { x: number; y: number }

/**
 * `x`/`y` put the item's home-sized box relative to its parent's top-left;
 * `rotate` then turns the box about its centre, in degrees clockwise.
 */
export type Attach = Offset & { rotate?: number }

/**
 * Where an item is on the stage. When `rotate` is set, the rect is the box
 * around the turned drawing, which keeps its home size at the rect's centre.
 */
export type Placement = Rect & { rotate?: number }

export type LabelSide = 'below' | 'right'

export type SceneLayout = {
  home: Record<string, Rect>
  zones: Record<string, Rect>
  /** Keyed by the attached item's id. */
  attach: Record<string, Attach>
  /** Keyed by zone id: a screen in the background that shows the reading of the item in that zone. */
  screens?: Record<string, Rect>
  /** Keyed by item id; labels sit below the item unless set here. */
  labelSide?: Record<string, LabelSide>
}
