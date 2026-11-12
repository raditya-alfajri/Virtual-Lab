import { describe, expect, it } from 'vitest'
import { reactionRate } from '../../data/kimia/reaction-rate'
import type { Interaction, ItemDef } from '../../data/types'
import {
  isInteractionTarget,
  pickDropTarget,
  type DropCandidate,
} from './drop-target'

const item = (id: string, order: number): DropCandidate => ({
  id,
  layer: 'item',
  order,
})
const zone = (id: string): DropCandidate => ({ id, layer: 'zone' })
const shelf: DropCandidate = { id: 'shelf', layer: 'shelf' }

describe('pickDropTarget', () => {
  it('drops a pipette on the tube standing in a rack, not on the rack', () => {
    const underPointer = [zone('rack-1'), item('tube-1', 3), item('pipette', 2)]
    expect(pickDropTarget(underPointer, 'pipette')).toBe('tube-1')
  })

  it('never picks the dragged item itself', () => {
    expect(pickDropTarget([item('pipette', 2)], 'pipette')).toBeUndefined()
    expect(pickDropTarget([item('pipette', 9), zone('sink')], 'pipette')).toBe(
      'sink',
    )
  })

  it('prefers items over zones and zones over the shelf', () => {
    expect(pickDropTarget([shelf, zone('sink'), item('tube-2', 1)], 'x')).toBe(
      'tube-2',
    )
    expect(pickDropTarget([shelf, zone('ph-card')], 'x')).toBe('ph-card')
    expect(pickDropTarget([shelf], 'x')).toBe('shelf')
  })

  it('picks the topmost of overlapping items', () => {
    expect(pickDropTarget([item('flask', 4), item('bath', 1)], 'x')).toBe(
      'flask',
    )
    expect(pickDropTarget([item('bath', 1), item('flask', 4)], 'x')).toBe(
      'flask',
    )
  })

  it('skips a target that stands for the dragged item, like its rack button', () => {
    const rackButton: DropCandidate = {
      id: 'rack:pipette',
      layer: 'item',
      itemId: 'pipette',
    }
    expect(pickDropTarget([shelf, rackButton], 'pipette')).toBe('shelf')
    expect(pickDropTarget([shelf, rackButton], 'tube-1')).toBe('rack:pipette')
  })

  it('returns undefined when nothing is under the pointer', () => {
    expect(pickDropTarget([], 'pipette')).toBeUndefined()
  })
})

describe('isInteractionTarget', () => {
  const rule = (source: string, target: string): Interaction => ({
    source,
    target,
    run: (world) => ({ world }),
  })
  const interactions = [rule('hcl', 'flask'), rule('thio', 'flask-kind')]
  const def = (id: string, kind: string): ItemDef => ({ id, kind, name: id })

  it('is true when an interaction targets the item by id or by kind', () => {
    expect(isInteractionTarget(interactions, def('flask', 'x'))).toBe(true)
    expect(isInteractionTarget(interactions, def('y', 'flask-kind'))).toBe(true)
  })

  it('is false for items that are only ever a source', () => {
    expect(isInteractionTarget(interactions, def('hcl', 'hcl'))).toBe(false)
    expect(isInteractionTarget(interactions, def('thermometer', 'x'))).toBe(
      false,
    )
  })
})

describe('isInteractionTarget on the reaction-rate scene', () => {
  const targetable = (id: string) => {
    const item = reactionRate.items.find((it) => it.id === id)
    return (
      item !== undefined && isInteractionTarget(reactionRate.interactions, item)
    )
  }

  it('lets drops pass through the thermometer onto the flask under it', () => {
    expect(targetable('thermometer')).toBe(false)
    expect(targetable('flask')).toBe(true)
  })

  it('keeps the paper and the bath as places for the flask', () => {
    expect(targetable('paper')).toBe(true)
    expect(targetable('bath')).toBe(true)
    expect(targetable('hcl')).toBe(false)
    expect(targetable('stopwatch')).toBe(false)
  })
})
