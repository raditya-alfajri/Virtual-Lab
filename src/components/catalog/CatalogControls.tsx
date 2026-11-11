import { Search } from 'lucide-react'
import type { Accent } from './experimentMeta'

export function SearchBox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative block md:max-w-md">
      <span className="sr-only">Cari eksperimen</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari eksperimen..."
        className="w-full rounded-2xl border border-line bg-white py-4 pr-4 pl-12 outline-none placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}

export function TopicChips({
  topics,
  active,
  onChange,
  accent,
}: {
  topics: string[]
  active: string | null
  onChange: (topic: string | null) => void
  accent: Accent
}) {
  const options: (string | null)[] = [null, ...topics]

  return (
    <div
      role="group"
      aria-label="Filter topik"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {options.map((topic) => (
        <button
          key={topic ?? 'semua'}
          type="button"
          aria-pressed={active === topic}
          onClick={() => onChange(topic)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
            active === topic ? `${accent.solid} text-white` : 'border-line bg-white'
          }`}
        >
          {topic ?? 'Semua'}
        </button>
      ))}
    </div>
  )
}