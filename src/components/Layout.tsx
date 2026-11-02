import { Outlet } from 'react-router'
import Navbar from './ui/navbar'

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <footer className="p-4 text-sm text-ink-muted">© 2026 Virtual Lab</footer>
    </>
  )
}
