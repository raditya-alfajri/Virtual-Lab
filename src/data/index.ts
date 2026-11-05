import type { Experiment } from './types'
import { acidBaseTest } from './kimia/acid-base-test'
import { solutionConcentration } from './kimia/solution-concentration'
import { reactionRate } from './kimia/reaction-rate'
import { newtonLaw } from './fisika/newton-law'
import { simplePendulum } from './fisika/simple-pendulum'
import { hookeLaw } from './fisika/hooke-law'

export const ALL_EXPERIMENTS: Experiment[] = [
  acidBaseTest,
  solutionConcentration,
  reactionRate,
  newtonLaw,
  simplePendulum,
  hookeLaw,
]
