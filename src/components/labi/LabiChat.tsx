import clsx from 'clsx'
import { Mic, MicOff, SendHorizontal, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
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

/** The conversation with Labi as text: transcript, typing box, microphone and sound switches. */
export default function LabiChat({ state, session, fill }: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const micOn = state.mic !== 'off'

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [state.messages, state.partial, state.status])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    session.ask(draft)
    setDraft('')
  }

  const status = micOn && state.partial ? '' : STATUS[state.status]

  const micButton = (
    <button
      type="button"
      onClick={() => session.toggleMic()}
      aria-pressed={micOn}
      aria-label={fill ? 'Bicara dengan Labi lewat mikrofon' : undefined}
      className={clsx(
        'flex shrink-0 items-center justify-center gap-2 rounded-full border text-[13px] font-semibold transition-colors',
        fill ? 'size-11' : 'h-9 flex-1',
        micOn
          ? 'border-rose-500 bg-rose-500 text-white'
          : 'border-line bg-white text-ink hover:border-primary hover:text-primary',
      )}
    >
      {micOn ? <Mic size={fill ? 18 : 15} /> : <MicOff size={fill ? 18 : 15} />}
      {!fill &&
        (state.mic === 'opening'
          ? 'Menyalakan…'
          : micOn
            ? 'Mendengarkan · ketuk untuk berhenti'
            : 'Bicara dengan Labi')}
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
        {micOn && state.partial && (
          <p className="max-w-[88%] shrink-0 self-end rounded-2xl rounded-br-sm border border-dashed border-primary/50 px-3 py-2 text-ink-muted italic">
            {state.partial}
          </p>
        )}
        {status && <p className="shrink-0 text-xs text-ink-muted">{status}</p>}
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
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder={micOn ? 'Labi mendengarkan…' : 'Tanya Labi…'}
          aria-label="Pesan untuk Labi"
          // 16px text on small screens: iOS zooms the page on smaller inputs.
          className={clsx(
            'min-w-0 flex-1 rounded-full border border-line bg-white px-4 outline-none focus:border-primary',
            fill ? 'h-11 text-base' : 'h-10',
          )}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
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
        Labi itu AI, jadi bisa keliru. Suaramu hanya diubah menjadi teks, tidak
        direkam.
      </p>
    </div>
  )
}
