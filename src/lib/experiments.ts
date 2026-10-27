import type { Experiment } from '../data/types'
import { ALL_EXPERIMENTS } from '../data'

export function getExperiments(subject?: string): Experiment[] {
  return subject
    ? ALL_EXPERIMENTS.filter((e) => e.subject === subject)
    : ALL_EXPERIMENTS
}

export function getExperiment(
  subject: string,
  id: string,
): Experiment | undefined {
  return ALL_EXPERIMENTS.find((e) => e.subject === subject && e.id === id)
}

export function searchExperiments(
  list: Experiment[],
  keyword: string,
): Experiment[] {
  const k = keyword.trim().toLowerCase()
  if (!k) return list
  return list.filter(
    (e) =>
      e.title.toLowerCase().includes(k) || e.summary.toLowerCase().includes(k),
  )
}

export function filterByTopic(
  list: Experiment[],
  topic: string | null,
): Experiment[] {
  return topic ? list.filter((e) => e.topic === topic) : list
}

export function getTopics(list: Experiment[]): string[] {
  return [...new Set(list.map((e) => e.topic))]
}

export function getRecommendations(exp: Experiment, count = 2): Experiment[] {
  return getExperiments(exp.subject)
    .filter((e) => e.id !== exp.id)
    .slice(0, count)
}
