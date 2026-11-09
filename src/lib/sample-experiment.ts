// Small experiment used only by engine tests. Not registered in the app.
import type { Experiment, ItemState, ItemView, World } from '../data/types'

export const LAMP_HOT_TEMP = 30

function updateItem(world: World, id: string, patch: ItemState): World {
  const item = world.items[id]
  return {
    ...world,
    items: {
      ...world.items,
      [id]: { ...item, state: { ...item.state, ...patch } },
    },
  }
}

export const sampleExperiment: Experiment = {
  id: 'contoh',
  subject: 'kimia',
  title: 'Contoh',
  topic: 'Contoh',
  summary: 'Eksperimen kecil untuk menguji mesin simulasi.',
  description: '',
  previewImage: '',
  objectives: [],
  tips: [],

  items: [
    {
      id: 'tube-1',
      kind: 'tube',
      name: 'Tabung 1',
      state: { filled: false, color: 'bening' },
    },
    {
      id: 'tube-2',
      kind: 'tube',
      name: 'Tabung 2',
      state: { filled: false, color: 'bening' },
    },
    {
      id: 'dye',
      kind: 'bottle',
      name: 'Botol pewarna',
      state: { color: 'biru' },
    },
    { id: 'meter', kind: 'meter', name: 'Pengukur warna' },
    {
      id: 'lamp',
      kind: 'lamp',
      name: 'Lampu',
      fixed: true,
      start: 'bench',
      state: { on: false, temp: 25 },
    },
  ],
  zones: [{ id: 'rack', name: 'Rak tabung', accepts: ['tube'], capacity: 1 }],

  interactions: [
    {
      source: 'bottle',
      target: 'tube',
      run: (world, sourceId, targetId) => {
        if (world.items[targetId].state.filled) {
          return { reject: 'Satu tabung hanya untuk satu larutan.' }
        }
        const color = world.items[sourceId].state.color
        return {
          world: updateItem(world, targetId, { filled: true, color }),
          events: [{ type: 'color-changed', itemId: targetId }],
          explanation: {
            result: `Tabung berwarna ${String(color)}.`,
            reason: 'Pewarna tercampur dengan isi tabung.',
          },
        }
      },
    },
    {
      // Listed after the kind rule on purpose: id rules must still win.
      source: 'dye',
      target: 'tube-2',
      run: () => ({ reject: 'Tabung 2 disiapkan sebagai pembanding.' }),
    },
    {
      source: 'meter',
      target: 'tube',
      run: (world, _sourceId, targetId) => {
        const tube = world.items[targetId].state
        if (!tube.filled) return { reject: 'Tabung masih kosong.' }
        return {
          world,
          record: { tabung: targetId, warna: tube.color },
          explanation: {
            result: `Warna tercatat: ${String(tube.color)}.`,
            reason: 'Data tercatat karena kamu memakai alat ukur.',
          },
        }
      },
    },
  ],

  use: {
    lamp: (world, itemId) => {
      const on = !world.items[itemId].state.on
      return {
        world: updateItem(world, itemId, { on }),
        events: on ? [{ type: 'heater-on', itemId }] : [],
      }
    },
  },

  tick: (world, dt) => {
    const lamp = world.items.lamp.state
    if (!lamp.on) return { world }
    const before = Number(lamp.temp)
    const temp = before + dt
    const becameHot = before < LAMP_HOT_TEMP && temp >= LAMP_HOT_TEMP
    return {
      world: updateItem(world, 'lamp', { temp }),
      events: becameHot ? [{ type: 'color-changed', itemId: 'lamp' }] : [],
      explanation: becameHot
        ? { result: 'Lampu jadi merah.', reason: 'Suhunya sudah tinggi.' }
        : undefined,
    }
  },

  view: (world) => {
    const out: Record<string, ItemView> = {}
    for (const [id, item] of Object.entries(world.items)) {
      out[id] = {
        color:
          typeof item.state.color === 'string' ? item.state.color : undefined,
        active: item.state.on === true,
        reading:
          typeof item.state.temp === 'number'
            ? `${item.state.temp.toFixed(1)} °C`
            : undefined,
      }
    }
    return out
  },

  columns: [
    { key: 'tabung', label: 'Tabung' },
    { key: 'warna', label: 'Warna' },
  ],
  prediction: { question: 'Apa warna tabung setelah diberi pewarna?' },
  lines: [],
  concepts: [],
}
