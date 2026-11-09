import clsx from 'clsx'
import type { ComponentType } from 'react'
import type { ItemView } from '../../data/types'

/** Asset components always fill the box the stage gives them. */
export type AssetProps = {
  name: string
  view: ItemView
}

const ASSETS: Partial<Record<string, ComponentType<AssetProps>>> = {}

type Props = {
  kind: string
  name: string
  view?: ItemView
}

export default function LabAsset({ kind, name, view = {} }: Props) {
  const Asset = ASSETS[kind] ?? PlaceholderAsset
  return <Asset name={name} view={view} />
}

function PlaceholderAsset({ name, view }: AssetProps) {
  const level = Math.min(1, Math.max(0, view.level ?? 0))
  return (
    <div className="relative size-full">
      <div
        className={clsx(
          'relative size-full overflow-hidden rounded-lg border-2 border-ink bg-bg/80',
          view.active && 'ring-4 ring-primary',
        )}
      >
        {level > 0 && (
          <div
            className={clsx(
              'absolute inset-x-0 bottom-0',
              !view.color && 'bg-primary-tint',
            )}
            style={{
              height: `${level * 100}%`,
              backgroundColor: view.color,
            }}
          />
        )}
        {view.visibility !== undefined && (
          <span
            className="absolute inset-0 grid place-items-center text-6xl font-bold text-ink"
            style={{ opacity: Number(view.visibility) }}
          >
            ✕
          </span>
        )}
      </div>
      {view.reading !== undefined && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-ink px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-bg">
          {view.reading}
        </span>
      )}
      <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 text-center text-xs leading-tight font-medium whitespace-nowrap text-ink">
        {view.label ?? name}
      </span>
    </div>
  )
}
