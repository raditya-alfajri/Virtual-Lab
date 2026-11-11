import clsx from 'clsx'
import type { Side } from '../../../simulations/types'

const SIDE_CLASS: Record<Side, string> = {
  below: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  above: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  right: 'top-1/2 left-full ml-2 -translate-y-1/2',
  left: 'top-1/2 right-full mr-2 -translate-y-1/2',
}

type Props = {
  text: string
  side?: Side
}

export default function AssetLabel({ text, side = 'below' }: Props) {
  return (
    <span
      className={clsx(
        'pointer-events-none absolute rounded-full border border-line bg-white px-2 py-0.5 text-xs leading-tight font-medium whitespace-nowrap text-ink shadow-sm',
        SIDE_CLASS[side],
      )}
    >
      {text}
    </span>
  )
}
