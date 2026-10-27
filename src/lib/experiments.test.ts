import { describe, it, expect } from 'vitest'
import {
  getExperiments,
  getExperiment,
  searchExperiments,
  filterByTopic,
  getTopics,
} from './experiments'
import { sampleK1 } from './sample-experiment'
import type { Experiment } from '../data/types'

const list: Experiment[] = [
  sampleK1,
  {
    ...sampleK1,
    id: 'konsentrasi-larutan',
    title: 'Konsentrasi Larutan',
    summary: 'Larutan CuSO4',
    topic: 'larutan',
  },
  {
    ...sampleK1,
    id: 'hukum-newton',
    title: 'Hukum Newton',
    summary: 'Gaya dan percepatan',
    subject: 'fisika',
    topic: 'gerak',
  },
]

describe('experiment data', () => {
  it('filters experiments by subject', () => {
    expect(getExperiments('kimia').every((e) => e.subject === 'kimia')).toBe(
      true,
    )
    expect(getExperiments('biologi')).toHaveLength(0)
  })

  it('finds an experiment by subject and id', () => {
    expect(getExperiment('kimia', 'uji-asam-basa')?.title).toBe(sampleK1.title)
    expect(getExperiment('kimia', 'tidak-ada')).toBeUndefined()
  })

  it('searches without caring about letter case', () => {
    expect(searchExperiments(list, 'NEWTON')).toHaveLength(1)
    expect(searchExperiments(list, 'cuso4')).toHaveLength(1)
  })

  it('returns everything for an empty keyword', () => {
    expect(searchExperiments(list, '   ')).toHaveLength(3)
  })

  it('filters by topic and lists unique topics', () => {
    expect(filterByTopic(list, 'gerak')).toHaveLength(1)
    expect(filterByTopic(list, null)).toHaveLength(3)
    expect(getTopics(list)).toEqual(['asam-basa', 'larutan', 'gerak'])
  })
})
