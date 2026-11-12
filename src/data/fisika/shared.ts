import { SHELF } from '../../lib/engine'
import type {
  Explanation,
  LabEvent,
  Outcome,
  Result,
  Row,
  Value,
  World,
} from '../types'

/** Helpers shared by the physics experiments. */

export function ok(
  world: World,
  extra: {
    record?: Row
    explanation?: Explanation
    hint?: string
    events?: LabEvent[]
  } = {},
): Outcome {
  return { world, ...extra }
}

export function reject(text: string): Result {
  return { reject: text }
}

export function num(world: World, id: string, key: string): number {
  return Number(world.items[id].state[key] ?? 0)
}

export function bool(world: World, id: string, key: string): boolean {
  return world.items[id].state[key] === true
}

export function update(
  world: World,
  id: string,
  patch: Record<string, Value>,
): World {
  const item = world.items[id]
  return {
    ...world,
    items: {
      ...world.items,
      [id]: { ...item, state: { ...item.state, ...patch } },
    },
  }
}

export function moveTo(world: World, id: string, at: string): World {
  return {
    ...world,
    items: { ...world.items, [id]: { ...world.items[id], at } },
  }
}

/** The items resting directly on `at`. */
export function itemsAt(world: World, at: string): string[] {
  return Object.keys(world.items).filter((id) => world.items[id].at === at)
}

/** The items resting on `id`, directly or on top of each other. */
function riders(world: World, id: string): string[] {
  return itemsAt(world, id).flatMap((child) => [child, ...riders(world, child)])
}

/**
 * Puts an item back on the shelf together with everything resting on it,
 * each with its starting state from `fresh`.
 */
export function toShelf(
  world: World,
  id: string,
  fresh: Record<string, Record<string, Value>>,
): World {
  const items = { ...world.items }
  for (const other of [id, ...riders(world, id)]) {
    items[other] = { at: SHELF, state: { ...fresh[other] } }
  }
  return { ...world, items }
}

export function round(x: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(x * f) / f
}

/** Numbers for students use a decimal comma: fmt(0.25, 2) → '0,25'. */
export function fmt(x: number, decimals: number): string {
  return x.toFixed(decimals).replace('.', ',')
}
