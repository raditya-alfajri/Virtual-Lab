import { Link, Outlet } from 'react-router'
import Navbar from './ui/Navbar'

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm text-ink-muted">
        <span>© 2026 Virtual Lab</span>
        <Link to="/tentang-ai" className="hover:text-ink hover:underline">
          Tentang AI
        </Link>
      </footer>
    </>
  )
}
