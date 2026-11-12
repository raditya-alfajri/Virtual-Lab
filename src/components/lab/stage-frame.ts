import { createContext, useContext } from 'react'

/** Where the scaled stage sits inside the room, in screen pixels. */
export type StageFrame = {
  scale: number
  left: number
  top: number
  /** Size of the room left of the panels. */
  width: number
  height: number
}

export const StageFrameContext = createContext<StageFrame>({
  scale: 0,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
})

export function useStageFrame(): StageFrame {
  return useContext(StageFrameContext)
}
