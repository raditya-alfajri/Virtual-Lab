import clsx from 'clsx'
import { ArrowRightIcon, FlaskConicalIcon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router'
import { labs } from '../data/labs'
import { getExperiments } from '../lib/experiments'

export default function LabList() {
  return (
    <main>
      <section className="mt-6 px-6 sm:mt-10 sm:px-10 md:px-14 lg:px-20 xl:px-24 2xl:px-28">
        <div className="lg:flex lg:items-center">
          <div className="lg:w-1/2 lg:pr-8">
            <div className="flex w-fit items-center gap-2 rounded-full bg-primary-tint px-3 py-2 *:text-primary md:mx-auto lg:mx-0">
              <SparklesIcon className="size-4" />
              <span className="text-xs font-medium uppercase">
                Saatnya bereksperimen
              </span>
            </div>
            <div className="mt-4">
              <h1 className="text-3xl font-extrabold max-sm:max-w-xs md:text-center md:text-4xl lg:text-left lg:text-ink">
                Mau menemukan{' '}
                <span className="text-primary">apa hari ini?</span>
              </h1>
              <p className="mt-3 text-sm text-ink-muted md:mx-auto md:mt-6 md:text-center lg:mr-14 lg:text-left">
                Pilih pelajaran favoritmu. Coba eksperimennya, amati, lalu
                temukan jawabannya sendiri.
              </p>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="mt-6 xl:pl-24">
              <div className="relative h-64 w-full rounded-2xl bg-primary-tint md:h-80">
                <div className="absolute right-3 bottom-3 flex w-fit items-center gap-2 rounded-xl border-line bg-white px-3 py-2">
                  <div className="rounded-md bg-primary-tint p-2">
                    <FlaskConicalIcon className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      Aman Mencoba, bebas mengulang.
                    </h3>
                    <p className="text-xs text-ink-muted">
                      Kenali zat dan lihat bagaimana reaksi terjadi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 font-medium md:mt-8 lg:mt-12">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Pilih pelajaranmu</h1>
            <p className="text-ink-muted">{labs.length} Pelajaran</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:*:w-1/2">
            {labs.map((lab) => (
              <div
                key={lab.subject}
                className="flex flex-col gap-2 rounded-md border border-line bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx('rounded-md p-4', {
                      'bg-primary-tint': lab.color == 'violet',
                      'bg-green-100': lab.color == 'green',
                    })}
                  >
                    <lab.icon
                      className={clsx('size-8', {
                        'text-primary': lab.color == 'violet',
                        'text-green-700': lab.color == 'green',
                      })}
                    />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-semibold">{lab.title}</h1>
                    <p className="text-ink-muted">{lab.caption}</p>
                  </div>
                  <p className="ml-auto shrink-0 self-start text-sm text-ink-muted">
                    {getExperiments(lab.subject).length} Eksperimen
                  </p>
                </div>
                <div className="mt-3 flex gap-3 text-sm font-medium">
                  {lab.tags.map((tag) => (
                    <p
                      key={tag}
                      className={clsx({
                        'text-primary': lab.color == 'violet',
                        'text-green-700': lab.color == 'green',
                      })}
                    >
                      {tag}
                    </p>
                  ))}
                </div>
                <Link
                  to={`/lab/${lab.subject}`}
                  className="mt-3 flex justify-between rounded-xl bg-primary px-5 py-3"
                >
                  <h1 className="font-bold text-white">Jelajahi {lab.title}</h1>
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
