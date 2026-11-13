import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Experiment } from '../data/types'
import { buildLabContext, describeRow } from '../lib/labi/context'
import { LabiSession } from '../lib/labi/session'
import type { useExperiment } from './useExperiment'

type Lab = ReturnType<typeof useExperiment>

const GREETING = 'Hai, aku Labi! Aku temani kamu praktikum, ya.'
const RECORDED = 'Datamu tercatat! Coba ubah satu hal, lalu bandingkan.'
/** Labi says hello first; the prediction question follows after this pause. */
const QUESTION_AFTER_MS = 4000

/**
 * Labi for one open experiment: it knows the bench and reacts to what happens
 * on it. It leads the steps until the first row is in the table, once per
 * visit to the page; a reset does not bring the guided start back.
 */
export function useLabi(experiment: Experiment, lab: Lab) {
  const [session] = useState(() => new LabiSession())
  const [guided, setGuided] = useState(true)
  if (guided && lab.rows.length > 0) setGuided(false)

  const latest = useRef({ experiment, lab, guided })
  useEffect(() => {
    latest.current = { experiment, lab, guided }
    session.describeWith((predictionAnswer) =>
      buildLabContext(experiment, {
        world: lab.world,
        view: lab.view,
        columns: lab.columns,
        rows: lab.rows,
        latest: lab.explanation
          ? `${lab.explanation.result} ${lab.explanation.reason}`
          : lab.hint,
        next: experiment.guide?.(lab.world, lab.rows)?.text ?? null,
        predictionAnswer,
        guided,
      }),
    )
  })
  const state = useSyncExternalStore(session.subscribe, session.getState)

  useEffect(() => {
    const { question, options } = experiment.prediction
    session.greet(GREETING)
    const timer = setTimeout(
      () => session.pose(`Tebak dulu, yuk. ${question}`, options ?? []),
      QUESTION_AFTER_MS,
    )
    return () => {
      clearTimeout(timer)
      session.shutdown()
    }
  }, [session, experiment])

  // Before the events below, so the reaction to the first row is already free.
  useEffect(() => {
    if (!guided) session.endGuidance()
  }, [session, guided])

  const { events } = lab
  useEffect(() => {
    const { experiment: exp, lab: now, guided: leading } = latest.current
    for (const event of events) {
      if (event.type === 'rejected') {
        // That did not work: during the guided start show the step that does,
        // afterwards say why.
        if (leading) {
          session.nudge()
          session.react('confused')
        } else if (now.hint) session.explain(now.hint)
        else session.react('confused')
        return
      }
      const line = exp.lines.find((l) => l.id === event.lineId)?.text
      if (event.type === 'record-added') {
        const row = now.rows.at(-1)
        const result = now.explanation?.result ?? ''
        session.notify(
          `Data baru tercatat di tabel pengamatan${row ? `: ${describeRow(now.columns, row)}` : ''}. Tabel sekarang berisi ${now.rows.length} baris. ${result}`,
          line ?? RECORDED,
        )
        return
      }
      if (line) {
        session.notify(line, line)
        return
      }
    }
  }, [events, session])

  // After the events above, so a reaction to a new result comes before the
  // next step.
  const { world, rows } = lab
  useEffect(() => {
    if (experiment.guide) session.guide(experiment.guide(world, rows))
  }, [session, experiment, world, rows])

  return { state, session }
}

export type Labi = ReturnType<typeof useLabi>
