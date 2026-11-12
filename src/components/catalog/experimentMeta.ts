import type { Experiment } from '../../data/types'

export type Subject = Experiment['subject']

export const ACCENT = {
  kimia: {
    text: 'text-primary',
    tint: 'bg-primary-tint',
    solid: 'border-primary bg-primary',
  },
  fisika: {
    text: 'text-fisika',
    tint: 'bg-fisika-tint',
    solid: 'border-fisika bg-fisika',
  },
}
export type Accent = (typeof ACCENT)[Subject]

export type ComingSoon = {
  id: string
  title: string
  topic: string
  summary: string
}

export const COMING_SOON: Partial<Record<Subject, ComingSoon[]>> = {}
