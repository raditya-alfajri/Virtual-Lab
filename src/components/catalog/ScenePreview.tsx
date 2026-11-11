import { useState } from 'react'
import { getBackgroundUrl } from '../../simulations'
import type { Accent } from './experimentMeta'
import { TopicIcon } from './TopicIcon'

type Props = {
  id: string
  topic: string
  accent: Accent
}

/**
 * Fills its positioned parent with the experiment's lab scene, or with a
 * plain backdrop and an icon when the experiment has no scene yet.
 */
export function ScenePreview({ id, topic, accent }: Props) {
  const src = getBackgroundUrl(id)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (failedSrc === src) {
    return (
      <div
        className={`absolute inset-0 grid place-items-center ${accent.tint}`}
      >
        <TopicIcon topic={topic} className={`size-10 ${accent.text}`} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className="absolute inset-0 size-full object-cover"
    />
  )
}
