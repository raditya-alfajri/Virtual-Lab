import { Beaker, Droplets, FlaskConical, type LucideIcon } from 'lucide-react'
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

export const TOPIC_ICON: Record<string, LucideIcon> = {
  'asam & basa': Droplets,
  larutan: Beaker,
  'reaksi kimia': FlaskConical,
  reaksi: FlaskConical,
}
export const FALLBACK_ICON: LucideIcon = FlaskConical

export type ComingSoon = {
  id: string
  title: string
  topic: string
  summary: string
}

export const COMING_SOON: Partial<Record<Subject, ComingSoon[]>> = {
  fisika: [
    {
      id: 'ayunan-sederhana',
      title: 'Ayunan Sederhana',
      topic: 'Gerak & gaya',
      summary: 'Amati periode ayunan saat panjang tali dan massa beban diubah.',
    },
    {
      id: 'hukum-hooke',
      title: 'Hukum Hooke',
      topic: 'Gerak & gaya',
      summary:
        'Hubungkan beban yang digantung dengan pertambahan panjang pegas.',
    },
  ],
}
