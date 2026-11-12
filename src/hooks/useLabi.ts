import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Experiment } from '../data/types'
import { buildLabContext, describeRow } from '../lib/labi/context'
import { LabiSession } from '../lib/labi/session'
import type { useExperiment } from './useExperiment'

type Lab = ReturnType<typeof useExperiment>

const RECORDED =
  'Data baru sudah tercatat di tabel. Coba ubah satu variabel, lalu bandingkan hasilnya.'

/** Labi for one open experiment: it knows the bench and reacts to what happens on it. */
export function useLabi(experiment: Experiment, lab: Lab) {
  const [session] = useState(() => new LabiSession())
  const latest = useRef({ experiment, lab })
  useEffect(() => {
    latest.current = { experiment, lab }
    session.describeWith((predictionAnswer) =>
      buildLabContext(experiment, {
        world: lab.world,
        view: lab.view,
        columns: lab.columns,
        rows: lab.rows,
        latest: lab.explanation
          ? `${lab.explanation.result} ${lab.explanation.reason}`
          : lab.hint,
        predictionAnswer,
      }),
    )
  })
  const state = useSyncExternalStore(session.subscribe, session.getState)

  useEffect(() => {
    const { question, options } = experiment.prediction
    session.greet(
      `Hai, aku Labi! Sebelum mulai, coba tebak dulu: ${question}`,
      options,
    )
    return () => session.shutdown()
  }, [session, experiment])

  const { events } = lab
  useEffect(() => {
    const { experiment: exp, lab: now } = latest.current
    for (const event of events) {
      if (event.type === 'rejected') {
        session.react('confused')
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

  return { state, session }
}

export type Labi = ReturnType<typeof useLabi>
