import { lazy, Suspense } from 'react'

const LabPage = lazy(() => import('./LabPage'))

/** Keeps the lab code (dnd-kit, motion) out of the main bundle. */
export default function LazyLabPage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center text-ink-muted">Memuat praktikum…</p>
      }
    >
      <LabPage />
    </Suspense>
  )
}
