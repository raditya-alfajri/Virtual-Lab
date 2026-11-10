import clsx from 'clsx'
import type { LabelSide } from '../../../simulations/types'

type Props = {
  text: string
  side?: LabelSide
}

export default function AssetLabel({ text, side = 'below' }: Props) {
  return (
    <span
      className={clsx(
        'pointer-events-none absolute rounded-full border border-line bg-white px-2 py-0.5 text-xs leading-tight font-medium whitespace-nowrap text-ink shadow-sm',
        side === 'right'
          ? 'top-1/2 left-full ml-2 -translate-y-1/2'
          : 'top-full left-1/2 mt-1.5 -translate-x-1/2',
      )}
    >
      {text}
    </span>
  )
}
