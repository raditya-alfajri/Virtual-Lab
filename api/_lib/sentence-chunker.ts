const SENTENCE_END = /[.!?…]+["')\]]*\s/g
const CLAUSE_END = /[,;:—]\s/g
const ABBREVIATIONS = /\b(?:dll|dsb|dst|yth|no|hlm|mr|mrs|dr|prof|vs|etc)\.\s$/i

/** The first chunk is cut early (at a clause) so speech starts as soon as possible. */
const FIRST_CLAUSE_MIN_CHARS = 20
const CLAUSE_MIN_CHARS = 90

/**
 * Turns a stream of model tokens into speakable chunks (sentences, or clauses
 * of long sentences) that can go to the voice as soon as they are complete.
 */
export class SentenceChunker {
  #buffer = ''
  #emitted = 0

  push(delta: string): string[] {
    this.#buffer += delta
    const chunks: string[] = []
    let cut: number
    while ((cut = this.#findCut()) > 0) {
      const chunk = this.#take(cut)
      if (chunk) chunks.push(chunk)
    }
    return chunks
  }

  /** The remaining text once the stream has ended. */
  flush(): string[] {
    const rest = this.#take(this.#buffer.length)
    return rest ? [rest] : []
  }

  #findCut(): number {
    for (const match of this.#buffer.matchAll(SENTENCE_END)) {
      const end = match.index + match[0].length
      if (!ABBREVIATIONS.test(this.#buffer.slice(0, end))) return end
    }
    const minChars =
      this.#emitted === 0 ? FIRST_CLAUSE_MIN_CHARS : CLAUSE_MIN_CHARS
    for (const match of this.#buffer.matchAll(CLAUSE_END)) {
      if (match.index >= minChars) return match.index + match[0].length
    }
    return 0
  }

  #take(length: number): string {
    const chunk = this.#buffer.slice(0, length).trim()
    this.#buffer = this.#buffer.slice(length)
    if (chunk) this.#emitted++
    return chunk
  }
}
