import clsx from 'clsx'
import { FlaskConical } from 'lucide-react'
import { Link, NavLink } from 'react-router'

const LINKS = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/lab', label: 'Laboratorium', end: false },
]

export default function Navbar() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto max-w-[1600px] px-6">
        <div className="flex h-16 items-center">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-heading text-xl font-extrabold"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-bg">
              <FlaskConical size={20} />
            </span>
            virtual lab.
          </Link>
        </div>
        <nav aria-label="Navigasi utama" className="-mb-px flex gap-6">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                clsx(
                  'border-b-2 pb-2.5 text-sm font-medium',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
