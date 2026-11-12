import {
  LIMITS,
  type ChatTurn,
  type LabContext,
  type Mood,
} from '../../../api/_lib/protocol'
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
  greet(text: string, choices: string[] = []) {
    if (this.#state.messages.length > 0) return
    this.#history.push({ role: 'assistant', text })
    this.#set({
      messages: [{ id: this.#nextId++, role: 'assistant', text }],
      bubble: text,
      choices,
      mood: 'happy',
    })
  }

  /** Puts the balloon away; the words stay in the transcript. */
  dismissBubble() {
    if (this.#state.bubble !== null) this.#set({ bubble: null })
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
    clearTimeout(this.#linger)
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
    this.#linger = setTimeout(() => {
      if (this.#state.status !== 'idle') return
      this.#set({
        mood: 'neutral',
        target: null,
        ...(clearBubble ? { bubble: null } : {}),
      })
    }, LINGER_MS)
  }

  async #run(fallback?: string) {
    this.#interrupt()
    clearTimeout(this.#linger)
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
    this.#set({ status: 'thinking', choices: [], notice: null })

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
    this.#set({ status: 'speaking', bubble: text, messages })
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
