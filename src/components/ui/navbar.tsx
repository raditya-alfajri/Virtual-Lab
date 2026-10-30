import clsx from 'clsx'
import { CircleQuestionMarkIcon, FlaskConicalIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'

export default function Navbar() {
  interface Path {
    label: string
    to: string
    isActive: (path: any) => boolean
  }

  const { pathname } = useLocation()

  const paths: Path[] = [
    {
      label: 'Beranda',
      to: '/',
      isActive: (path) => path == '/',
    },
    {
      label: 'Laboratorium',
      to: '/lab',
      isActive: (path) => path.includes('/lab'),
    },
  ]

  return (
    <>
      <nav className="sticky top-0 z-[99] flex items-start justify-between border-b border-b-black/10 bg-white px-6 pt-4 sm:px-10 md:px-14 lg:px-20 lg:pt-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-700 p-2">
              <FlaskConicalIcon className="size-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black">virtual lab.</h1>
          </div>
          <div className="flex space-x-5">
            {paths.map((path) => (
              <Link
                className={clsx(
                  path.isActive(pathname)
                    ? 'border-b-2 border-b-violet-700 text-violet-700'
                    : 'text-black/70',
                  'py-3',
                )}
                to={path.to}
              >
                {path.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-black/10 px-3 py-2 shadow-sm">
            <CircleQuestionMarkIcon className="size-5" />
            <h3 className="text-sm">Butuh bantuan?</h3>
          </div>
        </div>
      </nav>
    </>
  )
}
