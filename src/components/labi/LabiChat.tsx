import clsx from 'clsx'
import { Mic, SendHorizontal, Volume2, VolumeX } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import LabiChoices from './LabiChoices'
import type { LabiSession, LabiState } from '../../lib/labi/session'

type Props = {
  state: LabiState
  session: LabiSession
  /** Fill the height given, on small screens: the transcript takes what is left. */
  fill?: boolean
}

const STATUS: Record<LabiState['status'], string> = {
  idle: '',
  thinking: 'Labi sedang berpikir…',
  speaking: 'Labi sedang bicara…',
}

const MIC_STATUS: Record<LabiState['mic'], string> = {
  off: 'Tahan untuk bicara',
  opening: 'Menyalakan mikrofon…',
  listening: 'Mendengarkan…',
  sending: 'Mengirim…',
}

/** The end of what was heard, so the newest words stay in view. */
const tail = (text: string, max: number) =>
  text.length > max ? `…${text.slice(-max)}` : text

/** The conversation with Labi as text: transcript, typing box, talk button and sound switch. */
export default function LabiChat({ state, session, fill }: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const holding = state.mic !== 'off'

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [state.messages, state.status])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    session.ask(draft)
    setDraft('')
  }

  const press = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    session.holdMic()
  }
  const letGo = () => session.releaseMic()
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ') return
    event.preventDefault()
    if (!event.repeat) session.holdMic()
  }
  const keyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ') return
    event.preventDefault()
    letGo()
  }

  const micStatus = MIC_STATUS[state.mic]
  const heard = state.mic === 'listening' ? state.partial : ''

  const micButton = (
    <button
      type="button"
      onPointerDown={press}
      onPointerUp={letGo}
      onPointerCancel={letGo}
      onKeyDown={keyDown}
      onKeyUp={keyUp}
      onBlur={letGo}
      onContextMenu={(event) => event.preventDefault()}
      aria-pressed={holding}
      aria-label={
        fill
          ? 'Tahan untuk bicara dengan Labi, lepas untuk mengirim'
          : undefined
      }
      title="Tahan tombol ini selama kamu bicara, lalu lepas untuk mengirim"
      className={clsx(
        'flex shrink-0 touch-none flex-col items-center justify-center rounded-full border text-[13px] font-semibold transition-colors select-none [-webkit-touch-callout:none]',
        fill ? 'size-11' : 'min-h-9 flex-1 px-3 py-1',
        holding
          ? 'border-rose-500 bg-rose-500 text-white'
          : 'border-line bg-white text-ink hover:border-primary hover:text-primary',
      )}
    >
      <span className="flex items-center gap-2">
        <Mic size={fill ? 18 : 15} />
        {!fill && micStatus}
      </span>
      {!fill && heard && (
        <span className="max-w-full truncate text-xs font-normal italic">
          {tail(heard, 60)}
        </span>
      )}
    </button>
  )
  const muteButton = (
    <button
      type="button"
      onClick={() => session.toggleMute()}
      aria-pressed={state.muted}
      aria-label={state.muted ? 'Nyalakan suara Labi' : 'Matikan suara Labi'}
      title={state.muted ? 'Nyalakan suara Labi' : 'Matikan suara Labi'}
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink hover:border-primary hover:text-primary',
        fill ? 'size-11' : 'size-9',
      )}
    >
      {state.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  )

  return (
    <div
      className={clsx('flex flex-col', fill ? 'min-h-0 flex-1 gap-2' : 'gap-3')}
    >
      <div
        ref={listRef}
        role="log"
        aria-label="Percakapan dengan Labi"
        className={clsx(
          'flex flex-col gap-2 overflow-y-auto pr-1',
          fill ? 'min-h-0 flex-1' : 'max-h-64 min-h-24',
        )}
      >
        {state.messages.map((message) => (
          <p
            key={message.id}
            className={clsx(
              'max-w-[88%] shrink-0 rounded-2xl px-3 py-2',
              message.role === 'user'
                ? 'self-end rounded-br-sm bg-primary text-white'
                : 'self-start rounded-bl-sm bg-primary-tint text-ink',
            )}
          >
            {message.text}
          </p>
        ))}
        {STATUS[state.status] && (
          <p className="shrink-0 text-xs text-ink-muted">
            {STATUS[state.status]}
          </p>
        )}
        <div className="shrink-0 empty:hidden">
          <LabiChoices
            choices={state.choices}
            onChoose={(choice) => session.choose(choice)}
          />
        </div>
      </div>

      {state.notice && (
        <p
          role="alert"
          className="shrink-0 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          {state.notice}
        </p>
      )}

      <form onSubmit={submit} className="flex shrink-0 items-center gap-2">
        {fill && micButton}
        {fill && holding ? (
          // The icon button has no room for words: the field shows what is heard instead.
          <p
            aria-live="polite"
            className="flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-4 text-sm text-ink"
          >
            <span className="shrink-0 font-semibold text-rose-600">
              {micStatus}
            </span>
            <span className="truncate text-ink-muted italic">
              {heard && tail(heard, 40)}
            </span>
          </p>
        ) : (
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            placeholder="Tanya Labi…"
            aria-label="Pesan untuk Labi"
            // 16px text on small screens: iOS zooms the page on smaller inputs.
            className={clsx(
              'min-w-0 flex-1 rounded-full border border-line bg-white px-4 outline-none focus:border-primary',
              fill ? 'h-11 text-base' : 'h-10',
            )}
          />
        )}
        <button
          type="submit"
          disabled={!draft.trim() || (fill && holding)}
          aria-label="Kirim"
          className={clsx(
            'flex shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40',
            fill ? 'size-11' : 'size-10',
          )}
        >
          <SendHorizontal size={17} />
        </button>
        {fill && muteButton}
      </form>

      {!fill && (
        <div className="flex items-center gap-2">
          {micButton}
          {muteButton}
        </div>
      )}

      <p
        className={clsx(
          'shrink-0 text-ink-muted',
          fill ? 'text-[11px] leading-snug' : 'text-xs',
        )}
      >
        Labi itu AI, jadi bisa keliru. Suaramu diubah menjadi teks oleh
        ElevenLabs dan tidak disimpan.
      </p>
    </div>
  )
}
