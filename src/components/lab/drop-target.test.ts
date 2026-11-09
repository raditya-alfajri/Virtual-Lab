import { describe, expect, it } from 'vitest'
import { pickDropTarget, type DropCandidate } from './drop-target'

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

  it('returns undefined when nothing is under the pointer', () => {
    expect(pickDropTarget([], 'pipette')).toBeUndefined()
  })
})
