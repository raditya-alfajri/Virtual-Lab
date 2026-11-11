import type { ComponentType } from 'react'
import type { AssetProps } from './types'
import { WaterBathFront } from './WaterBath'

/** Asset parts drawn over the items resting in them, keyed by item kind. */
export const FRONTS: Partial<Record<string, ComponentType<AssetProps>>> = {
  bath: WaterBathFront,
}
