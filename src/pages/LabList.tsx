import {
  ArrowRightIcon,
  DotIcon,
  FlaskConicalIcon,
  SparklesIcon,
} from 'lucide-react'
import { labs } from '../data/lab'
import clsx from 'clsx'
import { Link } from 'react-router'

export default function LabList() {
  return (
    <main>
      <section className="mt-6 px-6 sm:mt-10 sm:px-10 md:px-14 lg:px-20">
        <div className="lg:flex lg:items-center">
          <div className="lg:w-1/2 lg:pr-8">
            <div className="flex w-fit items-center gap-2 rounded-full bg-violet-100 px-3 py-2 *:text-violet-700 md:mx-auto lg:mx-0">
              <SparklesIcon className="size-4" />
              <span className="text-xs font-medium uppercase">
                Saatnya bereksperimen
              </span>
            </div>
            <div className="mt-4">
              <h1 className="text-3xl font-extrabold max-sm:max-w-xs md:text-center md:text-4xl lg:text-left lg:text-black">
                Mau menemukan{' '}
                <span className="text-violet-700">apa hari ini?</span>
              </h1>
              <p className="mt-3 text-sm text-black/50 md:mx-auto md:mt-6 md:text-center lg:mr-14 lg:text-left">
                Pilih pelajaran favoritmu. Coba eksperimennya, amati, lalu
                temukan jawabannya sendiri.
              </p>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="mt-6 xl:pl-24">
              <div className="relative h-64 w-full rounded-2xl bg-black/50 md:h-80">
                {/* <div className="absolute top-3 left-3 flex w-fit items-center rounded-full border-black/10 bg-white"> */}
                {/*   <DotIcon className="size-9" /> */}
                {/*   <span className="-ml-1 pr-6 text-sm font-medium"> */}
                {/*     Laboratorium, versi digital */}
                {/*   </span> */}
                {/* </div> */}

                <div className="absolute right-3 bottom-3 flex w-fit items-center gap-2 rounded-xl border-black/10 bg-white px-3 py-2">
                  <div className="rounded-md bg-violet-200 p-2">
                    <FlaskConicalIcon className="text-violet-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      Aman Mencoba, bebas mengulang.
                    </h3>
                    <p className="text-xs text-black/50">
                      Kenali zat dan lihat bagaimana reaksi terjadi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 font-medium">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Pilih pelajaranmu</h1>
            <p className="text-black/50">{labs.length} Pelajaran</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:*:w-1/2">
            {labs.map((data) => (
              <div className="flex flex-col gap-2 rounded-md border border-black/10 bg-white p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={clsx('rounded-md p-4', {
                      'bg-violet-100': data.color == 'violet',
                      'bg-green-100': data.color == 'green',
                    })}
                  >
                    <data.icon
                      className={clsx('size-8', {
                        'text-violet-700': data.color == 'violet',
                        'text-green-700': data.color == 'green',
                      })}
                    />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-semibold">{data.title}</h1>
                    <p className="text-black/50">{data.caption}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 text-sm font-medium">
                  {data.tags.map((t) => (
                    <p
                      className={clsx({
                        'text-violet-700': data.color == 'violet',
                        'text-green-700': data.color == 'green',
                      })}
                    >
                      {t}
                    </p>
                  ))}
                </div>
                <Link
                  to={'#'}
                  className="mt-3 flex justify-between rounded-lg bg-violet-600 px-6 py-4"
                >
                  <h1 className="font-bold text-white">
                    Jelajahi {data.title}
                  </h1>
                  <ArrowRightIcon className="text-white" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
