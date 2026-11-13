import {
  LIMITS,
  type ChatTurn,
  type LabContext,
  type Mood,
} from '../../../api/_lib/protocol'
import type { GuideStep } from '../../data/types'
import { startRecording, type Recording } from './microphone'
import { SpeechPlayer, unlockAudio } from './speech-player'
import { requestTurn, TurnError } from './turn-client'

export type LabiMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
  /** Written by the model, not one of our prepared lines. */
  ai?: boolean
}

export type LabiState = {
  messages: LabiMessage[]
  status: 'idle' | 'thinking' | 'speaking'
  mood: Mood
  /** The item Labi flies to while it talks about it. */
  target: string | null
  /** What the speech balloon says right now. */
  bubble: string | null
  /** The balloon shows words written by the model. */
  bubbleByAi: boolean
  /** True while the balloon shows the next step on the bench. */
  guiding: boolean
  /** Answers the student can pick in the balloon. */
  choices: string[]
  /** What the microphone has heard so far while the talk button is held. */
  partial: string
  /**
   * The talk button: `opening` while the microphone starts, `listening` while
   * it is held, `sending` from letting go until the phrase is read.
   */
  mic: 'off' | 'opening' | 'listening' | 'sending'
  muted: boolean
  /** Why the last request or the microphone failed. */
  notice: string | null
}

type Turn = {
  abort: AbortController
  player: SpeechPlayer
  sentences: string[]
  /** The sentences the student has heard or seen so far. */
  heard: string[]
  messageId: number | null
}

/** One press of the talk button. */
type Hold = {
  at: number
  released: boolean
  recording: Recording | null
  limit: ReturnType<typeof setTimeout>
}

const UNAVAILABLE = 'Aku lagi tidak bisa menjawab. Coba lagi sebentar, ya.'
export const TOO_SHORT = 'Tahan tombolnya selama kamu bicara, ya.'
export const MIC_READY = 'Mikrofon siap. Tahan tombolnya sambil bicara, ya.'
export const NOT_HEARD = 'Labi tidak menangkap suaramu. Coba lagi, ya.'
/** How long the last sentence and the mood stay after Labi stops talking. */
const LINGER_MS = 6000
/** With a next step to show, Labi goes back to guiding sooner. */
const GUIDE_AFTER_MS = 3500
/** Least time between two reactions to what happens on the bench. */
const EVENT_COOLDOWN_MS = 8000
/** A shorter press is taken for a slip, not a question. */
const MIN_HOLD_MS = 500
/** A press is let go by itself after this long. */
const MAX_HOLD_MS = 60_000
/** A microphone that took longer to open was waiting for the student's permission. */
const PERMISSION_MS = 1000
const HISTORY = 24

const suggest = (step: string) => `Kalau mau, coba ini: ${step}`

/**
 * One conversation with Labi: the transcript, the reply being spoken, and the
 * talk button. The student holds the button while speaking; pressing it
 * silences Labi, and letting go sends the whole phrase. Labi leads the steps
 * on the bench only until the guided start is over.
 */
export class LabiSession {
  #state: LabiState = {
    messages: [],
    status: 'idle',
    mood: 'neutral',
    target: null,
    bubble: null,
    bubbleByAi: false,
    guiding: false,
    choices: [],
    partial: '',
    mic: 'off',
    muted: false,
    notice: null,
  }
  readonly #listeners = new Set<() => void>()
  #context: ((predictionAnswer: string | null) => LabContext) | null = null
  /** What is sent to the model; unlike `messages` it includes bench events. */
  #history: ChatTurn[] = []
  #turn: Turn | null = null
  #hold: Hold | null = null
  #answer: string | null = null
  #linger: ReturnType<typeof setTimeout> | undefined
  /** Whether the pending linger timer is to put the balloon away. */
  #clearing = false
  /** The next step on the bench; undefined until the lab reports one. */
  #step: GuideStep | null | undefined
  /** The student put this step's balloon away. */
  #stepHidden = false
  /** The guided start is over: steps are only shown when asked for. */
  #free = false
  #lastEventAt = -Infinity
  #nextId = 1

  /** Sets how the bench is described to Labi; call it whenever the lab changes. */
  describeWith(context: (predictionAnswer: string | null) => LabContext) {
    this.#context = context
  }

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  getState = () => this.#state

  /** Labi's opening words. They are written by us, not generated. */
  greet(text: string) {
    if (this.#state.messages.length > 0) return
    this.#history.push({ role: 'assistant', text })
    this.#set({
      messages: [{ id: this.#nextId++, role: 'assistant', text }],
      bubble: text,
      guiding: false,
      mood: 'happy',
    })
    this.#settleLater()
  }

  /**
   * The next step on the bench, written by us. During the guided start Labi
   * shows it whenever it has nothing else to say; afterwards only when asked.
   */
  guide(step: GuideStep | null) {
    const last = this.#step
    if (
      last !== undefined &&
      last?.text === step?.text &&
      last?.target === step?.target
    ) {
      return
    }
    this.#step = step
    this.#stepHidden = false
    // The first step waits for the greeting and the opening question.
    if (last === undefined) return
    if (step) this.#showGuide()
    else if (this.#state.guiding) {
      this.#set({ bubble: null, guiding: false, target: null })
    }
  }

  /** The guided start is over: the student experiments freely from now on. */
  endGuidance() {
    if (this.#free) return
    this.#free = true
    if (this.#state.guiding) {
      this.#set({ bubble: null, guiding: false, target: null })
    }
  }

  /** The student asks for the next step, e.g. by clicking Labi. */
  nudge() {
    this.#stepHidden = false
    if (!this.#state.guiding) this.#showGuide(true)
  }

  /** Says why an action did not work, in the lab's own words. */
  explain(reason: string) {
    if (this.#state.status !== 'idle' || this.#hold) return
    this.#cancelLinger()
    this.#set({
      bubble: reason,
      guiding: false,
      choices: [],
      target: null,
      mood: 'confused',
    })
    this.#settleLater()
  }

  /**
   * Labi asks a prepared question with answers to pick from. Skipped once the
   * student has started talking or working: the lab is theirs by then.
   */
  pose(question: string, choices: string[]) {
    const { messages, status } = this.#state
    if (status !== 'idle' || this.#hold) return
    if (messages.some((message) => message.role === 'user')) return
    // Already at work on the bench: the next step matters more than a guess.
    if (this.#state.guiding) return
    this.#cancelLinger()
    this.#history.push({ role: 'assistant', text: question })
    this.#set({
      messages: [
        ...messages,
        { id: this.#nextId++, role: 'assistant', text: question },
      ],
      bubble: question,
      guiding: false,
      choices,
      mood: 'curious',
      target: null,
    })
  }

  /** Puts the balloon away; the words stay in the transcript. */
  dismissBubble() {
    if (this.#state.bubble === null) return
    if (this.#state.guiding) {
      this.#stepHidden = true
      this.#set({ bubble: null, guiding: false, target: null })
      return
    }
    this.#set({ bubble: null, choices: [] })
    this.#showGuide()
  }

  /** The student says or types something. */
  ask(input: string) {
    const text = input.trim().slice(0, LIMITS.turnChars)
    if (!text) return
    unlockAudio()
    this.#interrupt()

    // A phrase that got no answer yet and this one are one message.
    const last = this.#history.at(-1)
    const messages = [...this.#state.messages]
    const shown = messages.at(-1)
    if (last?.role === 'user' && shown?.role === 'user') {
      last.text = `${last.text} ${text}`.slice(-LIMITS.turnChars)
      messages[messages.length - 1] = { ...shown, text: last.text }
    } else {
      this.#history.push({ role: 'user', text })
      messages.push({ id: this.#nextId++, role: 'user', text })
    }
    this.#set({ messages })
    void this.#run()
  }

  /** The student picks an answer to the prediction question. */
  choose(option: string) {
    this.#answer = option
    this.ask(`Tebakanku: ${option}`)
  }

  /**
   * Something happened on the bench. Labi reacts if it is not busy; `fallback`
   * is said instead when the reply cannot be generated.
   */
  notify(event: string, fallback?: string) {
    const now = performance.now()
    if (
      this.#state.status !== 'idle' ||
      this.#hold ||
      now - this.#lastEventAt < EVENT_COOLDOWN_MS
    ) {
      return
    }
    this.#lastEventAt = now
    this.#history.push({
      role: 'event',
      text: event.slice(0, LIMITS.turnChars),
    })
    void this.#run(fallback)
  }

  /** Shows a feeling for a moment without saying anything. */
  react(mood: Mood) {
    if (this.#state.status !== 'idle') return
    this.#set({ mood })
    this.#settleLater(false)
  }

  /** The talk button is pressed: Labi falls silent and listens until it is let go. */
  holdMic() {
    if (this.#hold) return
    unlockAudio()
    this.#interrupt()
    const hold: Hold = {
      at: performance.now(),
      released: false,
      recording: null,
      limit: setTimeout(() => this.releaseMic(), MAX_HOLD_MS),
    }
    this.#hold = hold
    this.#set({ mic: 'opening', partial: '', notice: null })
    startRecording((text) => {
      if (this.#hold === hold) this.#set({ partial: text })
    }).then(
      (recording) => {
        if (this.#hold !== hold) return recording.cancel()
        if (hold.released) {
          // Let go before the microphone was on, e.g. while the browser asked for it.
          recording.cancel()
          this.#dropHold()
          const asked = performance.now() - hold.at > PERMISSION_MS
          this.#set({ notice: asked ? MIC_READY : TOO_SHORT })
          return
        }
        hold.recording = recording
        this.#set({ mic: 'listening' })
      },
      (error: Error) => this.#micFailed(hold, error),
    )
  }

  /** The talk button is let go: the phrase goes to Labi, unless it was too short to be one. */
  releaseMic() {
    const hold = this.#hold
    if (!hold || hold.released) return
    hold.released = true
    clearTimeout(hold.limit)
    const { recording } = hold
    if (!recording) return
    if (performance.now() - hold.at < MIN_HOLD_MS) {
      this.#dropHold()
      this.#set({ notice: TOO_SHORT })
      return
    }
    this.#set({ mic: 'sending' })
    recording.finish().then(
      (text) => {
        if (this.#hold !== hold) return
        this.#dropHold()
        if (text) this.ask(text)
        else this.#set({ notice: NOT_HEARD })
      },
      (error: Error) => this.#micFailed(hold, error),
    )
  }

  toggleMute() {
    const muted = !this.#state.muted
    if (muted) this.#interrupt()
    else unlockAudio()
    this.#set({ muted })
  }

  /** Falls silent and lets go of the microphone. */
  shutdown() {
    this.#interrupt()
    this.#dropHold()
    this.#cancelLinger()
  }

  #cancelLinger() {
    clearTimeout(this.#linger)
    this.#clearing = false
  }

  /** Shows the next step: on its own during the guided start, as a suggestion when asked after it. */
  #showGuide(asked = false) {
    const step = this.#step
    if (!step || this.#stepHidden) return
    if (this.#state.status !== 'idle' || this.#hold) return
    if (this.#free && !asked) return
    this.#cancelLinger()
    if (this.#free) {
      this.#set({
        bubble: suggest(step.text),
        guiding: false,
        choices: [],
        target: step.target ?? null,
        mood: 'curious',
      })
      this.#settleLater()
      return
    }
    this.#set({
      bubble: step.text,
      guiding: true,
      choices: [],
      target: step.target ?? null,
      mood: 'neutral',
    })
  }

  /** Any new balloon is one of our own lines unless the patch says otherwise. */
  #set(patch: Partial<LabiState>) {
    const byAi = 'bubble' in patch ? { bubbleByAi: false } : {}
    this.#state = { ...this.#state, ...byAi, ...patch }
    for (const listener of this.#listeners) listener()
  }

  #dropHold() {
    const hold = this.#hold
    if (!hold) return
    this.#hold = null
    clearTimeout(hold.limit)
    hold.recording?.cancel()
    this.#set({ mic: 'off', partial: '' })
  }

  #micFailed(hold: Hold, error: Error) {
    if (this.#hold !== hold) return
    this.#dropHold()
    this.#set({ notice: error.message, mood: 'sad' })
    this.#settleLater(false)
  }

  #remember(role: ChatTurn['role'], text: string) {
    this.#history.push({ role, text })
    this.#history = this.#history.slice(-HISTORY)
  }

  /** Stops the reply in progress. What was already heard stays in the conversation. */
  #interrupt() {
    const turn = this.#turn
    if (!turn) return
    this.#turn = null
    turn.abort.abort()
    turn.player.stop()
    this.#close(turn)
  }

  #close(turn: Turn) {
    if (turn.heard.length > 0) this.#remember('assistant', turn.heard.join(' '))
    this.#set({ status: 'idle' })
  }

  /** Clears the balloon and the mood a while after Labi went quiet. */
  #settleLater(clearBubble = true) {
    clearTimeout(this.#linger)
    // A feeling shown meanwhile must not keep an older balloon open for good.
    this.#clearing ||= clearBubble
    const guideNext =
      this.#clearing && this.#step && !this.#stepHidden && !this.#free
    this.#linger = setTimeout(
      () => {
        const clear = this.#clearing
        this.#clearing = false
        if (this.#state.status !== 'idle') return
        if (this.#state.guiding) {
          this.#set({ mood: 'neutral' })
          return
        }
        this.#set({
          mood: 'neutral',
          target: null,
          ...(clear ? { bubble: null, choices: [] } : {}),
        })
        if (clear) this.#showGuide()
      },
      guideNext ? GUIDE_AFTER_MS : LINGER_MS,
    )
  }

  async #run(fallback?: string) {
    this.#interrupt()
    this.#cancelLinger()
    const turn: Turn = {
      abort: new AbortController(),
      sentences: [],
      heard: [],
      messageId: null,
      player: new SpeechPlayer({
        onSentence: (index) => this.#onSentence(turn, index),
        onEnd: () => this.#onEnd(turn),
      }),
    }
    this.#turn = turn
    this.#set({
      status: 'thinking',
      choices: [],
      notice: null,
      ...(this.#state.guiding
        ? { bubble: null, guiding: false, target: null }
        : {}),
    })

    try {
      if (!this.#context) throw new TurnError(UNAVAILABLE)
      const events = requestTurn(
        {
          turns: this.#history.slice(-LIMITS.turns),
          context: this.#context(this.#answer),
          voice: !this.#state.muted,
        },
        turn.abort.signal,
      )
      for await (const event of events) {
        if (this.#turn !== turn) return
        if (event.type === 'meta') {
          this.#set({ mood: event.mood, target: event.target ?? null })
        } else if (event.type === 'text') {
          turn.sentences[event.index] = event.text
        } else if (event.type === 'audio') {
          turn.player.play(event.index, event.data)
        } else if (event.type === 'audio-end') {
          turn.player.endSentence(
            event.index,
            turn.sentences[event.index] ?? '',
          )
        }
      }
    } catch (error) {
      if (this.#turn !== turn) return
      if (turn.heard.length === 0 && turn.sentences.length === 0) {
        this.#turn = null
        turn.player.stop()
        this.#fail(
          error instanceof TurnError ? error.message : UNAVAILABLE,
          fallback,
        )
        return
      }
    }
    if (this.#turn !== turn) return
    turn.sentences.forEach((text, index) =>
      turn.player.endSentence(index, text),
    )
    turn.player.finish()
  }

  #onSentence(turn: Turn, index: number) {
    if (this.#turn !== turn) return
    const text = turn.sentences[index]
    if (!text) return
    turn.heard.push(text)
    const messages = [...this.#state.messages]
    const spoken = turn.heard.join(' ')
    if (turn.messageId === null) {
      turn.messageId = this.#nextId++
      messages.push({
        id: turn.messageId,
        role: 'assistant',
        text: spoken,
        ai: true,
      })
    } else {
      const at = messages.findIndex((m) => m.id === turn.messageId)
      if (at >= 0) messages[at] = { ...messages[at], text: spoken }
    }
    // The balloon shows the sentence so far, not only its last clause.
    let from = turn.heard.length - 1
    while (from > 0 && !/[.!?…]["')\]]*$/.test(turn.heard[from - 1])) from--
    this.#set({
      status: 'speaking',
      bubble: turn.heard.slice(from).join(' '),
      bubbleByAi: true,
      guiding: false,
      messages,
    })
  }

  #onEnd(turn: Turn) {
    if (this.#turn !== turn) return
    this.#turn = null
    this.#close(turn)
    this.#settleLater()
  }

  /** No reply came: say the prepared line, or admit it. */
  #fail(message: string, fallback?: string) {
    if (fallback) {
      this.#remember('assistant', fallback)
      this.#set({
        status: 'idle',
        mood: 'happy',
        bubble: fallback,
        guiding: false,
        messages: [
          ...this.#state.messages,
          { id: this.#nextId++, role: 'assistant', text: fallback },
        ],
      })
    } else {
      this.#set({
        status: 'idle',
        mood: 'sad',
        bubble: message,
        guiding: false,
        notice: message,
      })
    }
    this.#settleLater()
  }
}
