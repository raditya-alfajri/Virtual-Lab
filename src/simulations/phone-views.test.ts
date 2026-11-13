import { describe, expect, it } from 'vitest'
import { ALL_EXPERIMENTS } from '../data'
import { createInitialState, getView } from '../lib/engine'
import { fitCamera, shownPart, visibleArea } from '../components/lab/camera'
import { layouts } from '.'
import { resolveItemRect } from './position'
import { STAGE_HEIGHT, STAGE_WIDTH, type Rect } from './types'

const STAGE = { width: STAGE_WIDTH, height: STAGE_HEIGHT }
/** The room left on upright phones 360 and 412 px wide, under the title, tabs and tool tray. */
const PHONES = [
  { width: 360, height: 504 },
  { width: 412, height: 594 },
]
const CHEMISTRY = ['uji-asam-basa', 'konsentrasi-larutan', 'laju-reaksi']

/** Every place a tool can be drawn: where it starts, and resting on each item it attaches to. */
function places(id: string) {
  const experiment = ALL_EXPERIMENTS.find((exp) => exp.id === id)!
  const layout = layouts[id]
  const state = createInitialState(experiment)
  const view = getView(experiment, state)
  const found: { name: string; rect: Rect }[] = []
  for (const item of experiment.items) {
    const rect = resolveItemRect(layout, state.world.items, item.id, view)
    if (rect) found.push({ name: item.id, rect })
    for (const parent of Object.keys(layout.attach[item.id] ?? {})) {
      const items = {
        ...state.world.items,
        [item.id]: { ...state.world.items[item.id], at: parent },
      }
      const resting = resolveItemRect(layout, items, item.id, view)
      if (resting)
        found.push({ name: `${item.id} on ${parent}`, rect: resting })
    }
  }
  for (const [zone, rect] of Object.entries(layout.zones)) {
    found.push({ name: `zone ${zone}`, rect })
  }
  return { layout, found }
}

describe('phone work areas of the chemistry labs', () => {
  describe.each(CHEMISTRY)('%s', (id) => {
    const { layout, found } = places(id)

    it.each(PHONES)(
      'shows every tool and place whole or not at all, $width px wide',
      (phone) => {
        for (const view of layout.views ?? []) {
          const seen = visibleArea(fitCamera(view.region, phone, STAGE), phone)
          const cut = found
            .map(({ name, rect }) => ({ name, part: shownPart(rect, seen) }))
            .filter(({ part }) => part > 0.001 && part < 0.999)
            .map(({ name, part }) => `${view.id}: ${name} ${part.toFixed(2)}`)
          expect(cut).toEqual([])
        }
      },
    )

    it('shows every tool and place whole in some work area', () => {
      for (const { name, rect } of found) {
        const whole = (layout.views ?? []).some((view) =>
          PHONES.every(
            (phone) =>
              shownPart(
                rect,
                visibleArea(fitCamera(view.region, phone, STAGE), phone),
              ) >= 0.999,
          ),
        )
        expect(whole, name).toBe(true)
      }
    })
  })

  it('keeps the solution bottles in reach with the pipette and the tubes', () => {
    const { layout, found } = places('uji-asam-basa')
    const together = [
      'bottle-cuka',
      'bottle-naoh',
      'pipette',
      'tube-1 ',
      'zone rack-1',
    ]
    const shows = (name: string, region: Rect) =>
      PHONES.every((phone) => {
        const rect = found.find((f) => `${f.name} `.startsWith(name))!.rect
        const seen = visibleArea(fitCamera(region, phone, STAGE), phone)
        return shownPart(rect, seen) >= 0.999
      })
    expect(
      (layout.views ?? []).some((view) =>
        together.every((name) => shows(name, view.region)),
      ),
    ).toBe(true)
  })

  it('shows the tube rack and the pH card whole in their own work area', () => {
    const { layout, found } = places('uji-asam-basa')
    const rack = layout.views?.find((view) => view.id === 'rack')
    expect(rack).toBeDefined()
    for (const name of ['zone rack-1', 'zone rack-3', 'zone ph-card']) {
      const rect = found.find((f) => f.name === name)!.rect
      for (const phone of PHONES) {
        const seen = visibleArea(fitCamera(rack!.region, phone, STAGE), phone)
        expect(shownPart(rect, seen), name).toBeGreaterThanOrEqual(0.999)
      }
    }
  })
})
