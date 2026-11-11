import clsx from 'clsx'
import {
  ArrowRightIcon,
  DotIcon,
  FlaskConicalIcon,
  SparklesIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { labs } from '../data/labs'

export default function Home() {
  return (
    <main>
      <section
        id="hero"
        className="mt-6 px-6 pb-20 sm:mt-10 sm:px-10 md:px-14 lg:px-20 xl:px-24 2xl:px-28"
      >
        <div className="lg:flex lg:items-center">
          <div className="lg:w-1/2">
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary-tint px-3 py-2 *:text-primary md:mx-auto lg:mx-0">
              <SparklesIcon className="size-4" />
              <span className="text-xs font-medium uppercase">
                Selamat datang di virtual lab.
              </span>
            </div>
            <div className="mt-4">
              <h1 className="text-3xl font-extrabold max-sm:max-w-[19rem] md:text-center md:text-4xl lg:text-left lg:text-ink">
                <span className="text-primary">
                  Rasa penasaranmu, <br />
                </span>
                awal penemuanmu.
              </h1>
              <p className="mt-3 text-sm text-ink-muted md:mx-auto md:mt-6 md:text-center lg:mr-14 lg:text-left">
                Jelajahi dunia kimia dan fisika lewat praktikum virtual. Coba,
                amati, dan temukan hal baru langsung dari layarmu.
              </p>
            </div>
            <Link
              className="mx-auto mt-6 flex items-center justify-between gap-3 rounded-xl bg-primary px-5 py-4 text-white md:w-fit lg:mx-0"
              to={'/lab'}
            >
              <h2 className="font-medium">Try Lab</h2>
              <ArrowRightIcon />
            </Link>
            <div className="mt-2 flex md:mt-4">
              <span className="w-full text-center text-sm text-ink-muted lg:text-left">
                Tanpa Instalasi. langsung eksperimen
              </span>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="mt-6 xl:pl-24">
              <div className="relative h-64 w-full rounded-2xl bg-primary-tint md:h-80">
                <div className="absolute top-3 left-3 flex w-fit items-center rounded-full border-line bg-white">
                  <DotIcon className="size-9" />
                  <span className="-ml-1 pr-6 text-sm font-medium">
                    Laboratorium, versi digital
                  </span>
                </div>

                <div className="absolute right-3 bottom-3 flex w-fit items-center gap-2 rounded-xl border-line bg-white px-3 py-2">
                  <div className="rounded-md bg-primary-tint p-2">
                    <FlaskConicalIcon className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      Eksperimen tanpa batas.
                    </h3>
                    <p className="text-xs text-ink-muted">
                      Aman Mencoba, bebas mengulang.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 md:mt-14">
          <h1 className="text-2xl font-extrabold md:mx-auto md:text-center lg:text-left">
            Dua dunia sains. <br /> Banyak Kemungkinan
          </h1>
          <p className="mt-3 text-ink-muted md:mx-auto md:mt-6 md:text-center lg:text-left">
            Belajar bukan cuma menghafal. yuk buktikan sendiri
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:*:w-1/2">
          {labs.map((data) => (
            <div
              key={data.subject}
              className="flex items-stretch gap-6 rounded-xl border border-line bg-white px-6 py-4 md:min-h-28"
            >
              <div
                className={clsx(`flex rounded-md p-3 px-4`, {
                  'bg-primary-tint': data.color == 'violet',
                  'bg-green-100': data.color == 'green',
                })}
              >
                <data.icon
                  className={clsx(`m-auto size-8`, {
                    'text-primary': data.color == 'violet',
                    'text-green-700': data.color == 'green',
                  })}
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold lg:text-xl">
                  Laboratorium {data.title}
                </h1>
                <p className="text-sm text-ink-muted lg:text-base">
                  {data.caption}
                </p>
                <div className="mt-auto flex items-center gap-3">
                  {data.tags.map((text) => (
                    <span
                      key={text}
                      className={clsx('text-sm font-medium', {
                        'text-primary': data.color == 'violet',
                        'text-green-700': data.color == 'green',
                      })}
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
