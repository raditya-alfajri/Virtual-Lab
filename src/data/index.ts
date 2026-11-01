import type { Experiment } from './types'
import { acidBaseTest } from './kimia/acid-base-test'
import { newtonLaw } from './fisika/newton-law'
import { simplePendulum } from './fisika/simple-pendulum'
import { hookeLaw } from './fisika/hooke-law'

export const ALL_EXPERIMENTS: Experiment[] = [
  acidBaseTest,
  newtonLaw,
  simplePendulum,
  hookeLaw,
]
