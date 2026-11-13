import {
  LIMITS,
  type ChatTurn,
  type LabContext,
  type Mood,
} from '../../../api/_lib/protocol'
import type { GuideStep } from '../../data/types'
import { openMicrophone, type Microphone } from './microphone'
import { SpeechPlayer, unlockAudio } from './speech-player'
import { isBackchannel, isLikelyEcho, words } from './speech-text'
import { requestTurn, TurnError } from './turn-client'

export type LabiMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
}

export type LabiState = {
  messages: LabiMessage[]
  status: 'idle' | 'thinking' | 'speaking'
  mood: Mood
  /** The item Labi flies to while it talks about it. */
  target: string | null
  /** What the speech balloon says right now. */
  bubble: string | null
  /** True while the balloon shows the next step on the bench. */
  guiding: boolean
  /** Answers the student can pick in the balloon. */
  choices: string[]
  /** What the microphone is hearing, before the phrase is final. */
  partial: string
  mic: 'off' | 'opening' | 'on'
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

const UNAVAILABLE = 'Aku lagi tidak bisa menjawab. Coba lagi sebentar, ya.'
/** How long the last sentence and the mood stay after Labi stops talking. */
const LINGER_MS = 6000
/** With a next step to show, Labi goes back to guiding sooner. */
const GUIDE_AFTER_MS = 3500
/** Least time between two reactions to what happens on the bench. */
const EVENT_COOLDOWN_MS = 8000
/** After Labi stops, its own voice may still come back through the microphone. */
const ECHO_TAIL_MS = 3000
const HISTORY = 24

/**
 * One conversation with Labi: the transcript, the reply being spoken, and the
 * microphone. It decides whose turn it is the way people do: Labi starts to
 * answer as soon as a phrase ends, drops the answer if the student goes on
 * talking, and stops mid-sentence when the student cuts in.
 */
export class LabiSession {
  #state: LabiState = {
    messages: [],
    status: 'idle',
    mood: 'neutral',
    target: null,
    bubble: null,
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
  #mic: Microphone | null = null
  #answer: string | null = null
  #linger: ReturnType<typeof setTimeout> | undefined
  /** Whether the pending linger timer is to put the balloon away. */
  #clearing = false
  /** The next step on the bench; undefined until the lab reports one. */
  #step: GuideStep | null | undefined
  /** The student put this step's balloon away. */
  #stepHidden = false
  #lastSpoken = ''
  #lastSpokenAt = -Infinity
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
   * The next step on the bench, written by us. Labi shows it whenever it has
   * nothing else to say, so the student always knows what to do.
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

  /** The student asks for the next step again, e.g. by clicking Labi. */
  nudge() {
    this.#stepHidden = false
    if (!this.#state.guiding) this.#showGuide()
  }

  /**
   * Labi asks a prepared question with answers to pick from. Skipped once the
   * student has started talking or working: the lab is theirs by then.
   */
  pose(question: string, choices: string[]) {
    const { messages, status, partial } = this.#state
    if (status !== 'idle' || partial) return
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
      this.#state.partial ||
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

  toggleMic() {
    unlockAudio()
    if (this.#state.mic !== 'off') {
      this.#closeMic()
      return
    }
    this.#set({ mic: 'opening', notice: null })
    openMicrophone({
      onPartial: (text) => this.#onPartial(text),
      onCommitted: (text) => this.#onCommitted(text),
      onClose: (message) => {
        this.#mic = null
        this.#set({ mic: 'off', partial: '', notice: message ?? null })
      },
    }).then(
      (mic) => {
        if (this.#state.mic !== 'opening') return mic.close()
        this.#mic = mic
        this.#set({ mic: 'on' })
      },
      (error: Error) => {
        if (this.#state.mic !== 'opening') return
        this.#set({ mic: 'off', notice: error.message, mood: 'sad' })
        this.#settleLater(false)
      },
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
    this.#closeMic()
    this.#cancelLinger()
  }

  #cancelLinger() {
    clearTimeout(this.#linger)
    this.#clearing = false
  }

  #showGuide() {
    const step = this.#step
    const { status, partial } = this.#state
    if (!step || this.#stepHidden || status !== 'idle' || partial) return
    this.#cancelLinger()
    this.#set({
      bubble: step.text,
      guiding: true,
      choices: [],
      target: step.target ?? null,
      mood: 'neutral',
    })
  }

  #set(patch: Partial<LabiState>) {
    this.#state = { ...this.#state, ...patch }
    for (const listener of this.#listeners) listener()
  }

  #closeMic() {
    this.#mic?.close()
    this.#mic = null
    this.#set({ mic: 'off', partial: '' })
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
    if (turn.heard.length > 0) {
      const spoken = turn.heard.join(' ')
      this.#remember('assistant', spoken)
      this.#lastSpoken = spoken
      this.#lastSpokenAt = performance.now()
    }
    this.#set({ status: 'idle' })
  }

  /** Clears the balloon and the mood a while after Labi went quiet. */
  #settleLater(clearBubble = true) {
    clearTimeout(this.#linger)
    // A feeling shown meanwhile must not keep an older balloon open for good.
    this.#clearing ||= clearBubble
    const guideNext = this.#clearing && this.#step && !this.#stepHidden
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
      messages.push({ id: turn.messageId, role: 'assistant', text: spoken })
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

  #isEcho(text: string) {
    if (this.#turn) return isLikelyEcho(text, this.#turn.sentences.join(' '))
    return (
      performance.now() - this.#lastSpokenAt < ECHO_TAIL_MS &&
      isLikelyEcho(text, this.#lastSpoken)
    )
  }

  #onPartial(text: string) {
    if (this.#isEcho(text)) return
    this.#set({ partial: text })
    if (this.#state.status === 'thinking') {
      // The student was not done: drop the answer that was on its way.
      this.#interrupt()
    } else if (
      this.#state.status === 'speaking' &&
      words(text).length >= 2 &&
      !isBackchannel(text)
    ) {
      this.#interrupt()
    }
  }

  #onCommitted(text: string) {
    this.#set({ partial: '' })
    if (this.#isEcho(text)) return
    if (this.#state.status === 'speaking' && isBackchannel(text)) return
    this.ask(text)
  }
}
