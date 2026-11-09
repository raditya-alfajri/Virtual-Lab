export const STAGE_WIDTH = 1440
export const STAGE_HEIGHT = 1024

export type Rect = { x: number; y: number; w: number; h: number }
export type Offset = { x: number; y: number }

export type SceneLayout = {
  home: Record<string, Rect>
  zones: Record<string, Rect>
  /** Keyed by the attached item's id, relative to its parent's top-left. */
  attach: Record<string, Offset>
  /** Corner of the stage each floating panel sits in, away from busy parts of the scene. */
  panels: { explanation: PanelCorner }
}

export type PanelCorner = 'top-left' | 'top-right'
