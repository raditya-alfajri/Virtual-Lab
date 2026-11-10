export const INK = '#2B2D42'
export const WHITE = '#FFFFFF'
export const GLASS = '#EEF6FA'
export const GLASS_RIM = '#D7EAF2'
export const LIQUID = '#7CC6D9'
export const METAL = '#B3BACB'
export const METAL_DARK = '#7D859C'
export const SLATE = '#4B5468'
export const RED = '#E3604F'
export const ORANGE = '#F4A340'
export const CRYSTAL = '#2F80ED'

export const OUTLINE = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

export const SHINE = {
  stroke: WHITE,
  strokeWidth: 3,
  strokeLinecap: 'round',
  opacity: 0.85,
} as const

export const EASE = { duration: 0.5, ease: 'easeOut' } as const
