import { PX_PER_M } from '../../../simulations/hooke-law/scale'
import AssetSvg from './AssetSvg'
import { INK, METAL, METAL_DARK } from './svg-style'
import type { AssetProps } from './types'

// F3 spring: 40 wide and as long as its box, so it is drawn 1 : 1. Hooks of
// 12 px at both ends, 14 coils stretched in between. The stiffer spring
// (Pegas B) has a thicker, darker wire.
const COILS = 14
const HOOK = 12
const NATURAL_PX = 150

export default function Spring({ name, view }: AssetProps) {
  const length = Number(view.length)
  const px =
    Number.isFinite(length) && length > 0 ? length * PX_PER_M : NATURAL_PX
  const h = Math.max(px, 2 * HOOK + COILS * 2)
  const pitch = (h - 2 * HOOK) / COILS
  const zigzag = Array.from({ length: COILS }, (_, i) => {
    const y = HOOK + i * pitch
    return `L${i % 2 ? 6 : 34} ${y + pitch / 2}`
  }).join(' ')
  const d = `M20 0 V${HOOK - 2} L20 ${HOOK} ${zigzag} L20 ${h - HOOK} V${h}`
  const stiff = name.trim().endsWith('B')
  const wire = stiff ? 4.5 : 3
  return (
    <AssetSvg width={40} height={h}>
      <path
        d={d}
        stroke={INK}
        strokeWidth={wire + 3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={d}
        stroke={stiff ? METAL_DARK : METAL}
        strokeWidth={wire}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </AssetSvg>
  )
}
