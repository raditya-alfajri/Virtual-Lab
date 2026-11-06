import type { Value } from '../../../data/types'
import type { Rect } from '../../../simulations/types'
import LabAsset from '../LabAsset'

// Gambar kecil benda (mis. di rak alat), dimuatkan ke kotak `size` × `size`
// dengan perbandingan sisi kotak home-nya.
export default function MiniAsset({
  kind,
  name,
  view,
  home,
  size,
}: {
  kind: string
  name: string
  view?: Record<string, Value>
  home?: Rect
  size: number
}) {
  const k = home ? Math.min(size / home.w, size / home.h) : 1
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <span
        className="block"
        style={{
          width: home ? home.w * k : size,
          height: home ? home.h * k : size,
        }}
      >
        <LabAsset kind={kind} name={name} view={view} />
      </span>
    </span>
  )
}
