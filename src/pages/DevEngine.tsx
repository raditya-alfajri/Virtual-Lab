import { useState } from 'react'
import { useExperiment } from '../hooks/useExperiment'
import { experiment_k1 } from '../lib/experiment'

const ACTIONS = ['tube->rack', 'solution->tube', 'indicator->tube']
const SOLUTIONS = ['cuka', 'air-jeruk', 'air-suling', 'air-sabun', 'naoh']

export default function DevEngine() {
  const engine = useExperiment(experiment_k1)
  const [solution, setSolution] = useState('cuka')

  return (
    <div className="space-y-4 p-6">
      <h1 className="font-heading text-2xl">Uji mesin: {experiment_k1.title}</h1>
      <p>Langkah aktif: {experiment_k1.steps[engine.activeStep]?.instruction}</p>
      <select value={solution} onChange={(e) => setSolution(e.target.value)} className="border border-line p-1">
        {SOLUTIONS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button key={a} onClick={() => engine.performAction(a, { solution })} className="rounded bg-primary px-3 py-1 text-white">
            {a}
          </button>
        ))}
        <button onClick={engine.reset} className="rounded border border-line px-3 py-1">Reset</button>
      </div>
      <pre className="overflow-x-auto rounded bg-white p-4 text-sm">{JSON.stringify(engine, null, 2)}</pre>
    </div>
  )
}