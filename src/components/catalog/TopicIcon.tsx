import { Beaker, Droplets, FlaskConical, type LucideIcon } from 'lucide-react'

const TOPIC_ICON: Record<string, LucideIcon> = {
  'asam & basa': Droplets,
  larutan: Beaker,
  'reaksi kimia': FlaskConical,
  reaksi: FlaskConical,
}

export function TopicIcon({
  topic,
  className,
}: {
  topic: string
  className?: string
}) {
  const Icon = TOPIC_ICON[topic.toLowerCase()] ?? FlaskConical
  return <Icon aria-hidden className={className} />
}
