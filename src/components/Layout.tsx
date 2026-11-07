import { Outlet } from 'react-router'

export default function Layout() {
  return (
    <>
      <header className="border-b border-line p-4 font-heading font-extrabold">virtual lab.</header>
      <main className="min-h-screen">
        <Outlet />
      </main>
      <footer className="p-4 text-sm text-ink-muted">© 2026 Virtual Lab</footer>
    </>
  )
}