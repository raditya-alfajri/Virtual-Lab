import { Outlet, useMatch } from 'react-router'
import { useCompactLayout } from './lab/mobile/use-media-query'
import Navbar from './ui/Navbar'

export default function Layout() {
  const compact = useCompactLayout()
  const inLab = useMatch('/lab/:subject/:id/mulai') !== null
  // On a phone the lab fills the screen and brings its own top bar.
  const immersive = compact && inLab

  return (
    <>
      {!immersive && <Navbar />}
      <main className={immersive ? undefined : 'min-h-screen'}>
        <Outlet />
      </main>
      {!immersive && (
        <footer className="p-4 text-sm text-ink-muted">
          © 2026 Virtual Lab
        </footer>
      )}
    </>
  )
}
