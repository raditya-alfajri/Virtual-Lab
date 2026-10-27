import { describe, it, expect } from 'vitest'
import { ALL_EXPERIMENTS } from '.'
import { createWorld } from '../lib/engine'
import { SHELF } from './instruments'

describe.each(ALL_EXPERIMENTS.map((e) => [e.id, e] as const))(
  'data integrity: %s',
  (_id, exp) => {
    const kinds = new Set(exp.items.map((i) => i.kind))
    const zoneIds = exp.zones.map((z) => z.id)

    it('uses unique ids for items and zones', () => {
      const ids = [...exp.items.map((i) => i.id), ...zoneIds, SHELF]
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('starts every item on the shelf or in a zone', () => {
      for (const item of exp.items) {
        expect([SHELF, ...zoneIds]).toContain(item.start ?? SHELF)
      }
    })

    it('only refers to kinds and zones that exist', () => {
      for (const zone of exp.zones) {
        for (const kind of zone.accepts) expect(kinds).toContain(kind)
      }
      for (const i of exp.interactions) {
        expect(kinds).toContain(i.source)
        expect([...kinds, ...zoneIds, SHELF]).toContain(i.target)
      }
      for (const handlers of [exp.use, exp.pull, exp.release]) {
        for (const kind of Object.keys(handlers ?? {})) {
          expect(kinds).toContain(kind)
        }
      }
    })

    it('has catalog text and observation columns', () => {
      expect(exp.title && exp.summary && exp.description).toBeTruthy()
      expect(exp.objectives.length).toBeGreaterThan(0)
      expect(exp.observationColumns.length).toBeGreaterThan(0)
    })

    it('is idle and renders a view at the start', () => {
      const world = createWorld(exp)
      expect(exp.isActive(world)).toBe(false)
      expect(exp.view(world)).toBeTypeOf('object')
    })
  },
)
