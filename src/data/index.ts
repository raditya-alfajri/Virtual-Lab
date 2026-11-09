import type { Experiment } from './types'
import { acidBaseTest } from './kimia/acid-base-test'
import { solutionConcentration } from './kimia/solution-concentration'
import { reactionRate } from './kimia/reaction-rate'

export const ALL_EXPERIMENTS: Experiment[] = [
  acidBaseTest,
  solutionConcentration,
  reactionRate,
]
