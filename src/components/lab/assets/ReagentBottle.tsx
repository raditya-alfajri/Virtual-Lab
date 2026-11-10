import { stickerLines } from './asset-math'
import AssetSvg from './AssetSvg'
import Liquid from './Liquid'
import {
  GLASS,
  GLASS_RIM,
  INK,
  ORANGE,
  OUTLINE,
  SHINE,
  WHITE,
} from './svg-style'
import type { AssetProps } from './types'

const SHAPE =
  'M14 62 Q14 48 28 48 H62 Q76 48 76 62 V132 Q76 142 66 142 H24 Q14 142 14 132 Z'
const DEFAULT_LEVEL = 0.66

type Props = AssetProps & {
  capColor?: string
  /** A fixed first sticker line, such as the chemical formula. */
  title?: string
}

export default function ReagentBottle({
  name,
  view,
  capColor = ORANGE,
  title,
}: Props) {
  const label = view.label ?? name
  const lines = title ? [title, label] : stickerLines(label)
  const fontSize = lines.length > 1 ? 8.5 : 10
  const firstBaseline = lines.length > 1 ? 101 : 107

  return (
    <AssetSvg width={90} height={150}>
      <path d={SHAPE} fill={GLASS} />
      <Liquid
        shape={SHAPE}
        width={90}
        height={150}
        bottom={142}
        top={48}
        level={view.level ?? DEFAULT_LEVEL}
        color={view.color}
      />
      <path d={SHAPE} {...OUTLINE} />
      <rect
        x="32"
        y="26"
        width="26"
        height="24"
        fill={GLASS_RIM}
        {...OUTLINE}
      />
      <rect
        x="27"
        y="10"
        width="36"
        height="18"
        rx="4"
        fill={capColor}
        {...OUTLINE}
      />
      <rect
        x="24"
        y="88"
        width="42"
        height="30"
        rx="4"
        fill={WHITE}
        {...OUTLINE}
      />
      <text
        x="45"
        fontFamily="Inter, Arial"
        fontSize={fontSize}
        fontWeight={700}
        fill={INK}
        textAnchor="middle"
      >
        {lines.map((line, i) => (
          <tspan key={i} x="45" y={firstBaseline + i * 10}>
            {line}
          </tspan>
        ))}
      </text>
      <line x1="22" y1="62" x2="22" y2="128" {...SHINE} />
    </AssetSvg>
  )
}
