import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Accent } from '../catalog/experimentMeta'

export function SectionCard({
  id,
  icon: Icon,
  title,
  accent,
  children,
}: {
  id?: string
  icon: LucideIcon
  title: string
  accent: Accent
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-3xl border border-line bg-white p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`grid size-9 place-items-center rounded-xl ${accent.tint} ${accent.text}`}
        >
          <Icon className="size-4.5" />
        </span>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}
