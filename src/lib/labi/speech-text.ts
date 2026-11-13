const BACKCHANNELS = new Set(
  'ok oke okey okay iya ya yap baik sip eh em emm hmm mm oh ah betul nah'.split(
    ' ',
  ),
)

/** Lower-cased words without punctuation. */
export function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
}

/** Short acknowledgements ("oke", "hmm iya") that should not cut Labi off. */
export function isBackchannel(text: string): boolean {
  const tokens = words(text)
  return (
    tokens.length > 0 &&
    tokens.length <= 3 &&
    tokens.every((token) => BACKCHANNELS.has(token))
  )
}

/**
 * True when what the microphone heard is mostly Labi's own words: the
 * speakers leaking into the microphone despite echo cancellation.
 */
export function isLikelyEcho(heard: string, spoken: string): boolean {
  const heardWords = words(heard)
  if (heardWords.length === 0 || !spoken) return false
  const spokenWords = new Set(words(spoken))
  const overlap = heardWords.filter((word) => spokenWords.has(word)).length
  return overlap / heardWords.length >= 0.7
}
