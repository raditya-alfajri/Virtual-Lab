import type { LabContext } from '../../../api/_lib/protocol'
import { formatCell } from '../../components/lab/format-cell'
import type { Column, Experiment, ItemView, Row, World } from '../../data/types'
import { SHELF } from '../engine'

type LabState = {
  world: World
  view: Record<string, ItemView>
  columns: Column[]
  rows: Row[]
  latest: string | null
  next: string | null
  predictionAnswer: string | null
}

/** The open experiment and the state of the bench, in words, for Labi. */
export function buildLabContext(exp: Experiment, state: LabState): LabContext {
  const nameOf = (id: string) =>
    exp.items.find((item) => item.id === id)?.name ??
    exp.zones.find((zone) => zone.id === id)?.name ??
    id

  return {
    title: exp.title,
    topic: exp.topic,
    objectives: exp.objectives,
    concepts: exp.concepts.map((c) => `${c.title}: ${c.content}`),
    items: exp.items.map((item) => {
      const at = state.world.items[item.id]?.at ?? SHELF
      const view = state.view[item.id]
      const note = [view?.label, view?.reading]
        .filter((part) => part && part !== item.name)
        .join(', ')
      return {
        id: item.id,
        name: item.name,
        at: at === SHELF ? 'di rak alat' : `di ${nameOf(at)}`,
        note: note || undefined,
      }
    }),
    columns: state.columns.map((column) => column.label),
    rows: state.rows.map((row) =>
      state.columns.map((column) => formatCell(row[column.key])),
    ),
    prediction: {
      question: exp.prediction.question,
      answer: state.predictionAnswer ?? undefined,
    },
    latest: state.latest ?? undefined,
    next: state.next ?? undefined,
  }
}

/** A new table row as a sentence, e.g. "Gaya F (N) 4, Massa m (kg) 0,5". */
export function describeRow(columns: Column[], row: Row): string {
  return columns
    .map((column) => `${column.label} ${formatCell(row[column.key])}`)
    .join(', ')
}
